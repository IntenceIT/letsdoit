import { useState, useEffect } from 'react';
import { tasksService, taskAssignmentsService } from '@/integrations/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { Task, TaskAssignment } from '@/integrations/firebase/types';

export interface TaskWithAssignment extends Task {
  assignment?: TaskAssignment;
  completedByUser?: string;
}

const WEEKDAY_MAP: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
};

export const useTasks = (selectedDate: Date) => {
  const { user, member, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<TaskWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user || !member) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      const dayName = Object.keys(WEEKDAY_MAP).find(key => WEEKDAY_MAP[key] === dayOfWeek) || '';

      // Fetch all tasks for the organization
      const allTasks = await tasksService.getByOrganization(member.organization_id);

      // Filter tasks based on type and date
      const filteredTasks = (allTasks || []).filter((task: Task) => {
        if (task.task_type === 'permanent') {
          return task.weekdays?.includes(dayName);
        } else {
          // Handle date comparison safely
          let startDate: Date | null = null;
          let endDate: Date | null = null;

          if (task.start_date) {
            if (typeof task.start_date === 'string') {
              startDate = new Date(task.start_date);
            } else if (task.start_date instanceof Date) {
              startDate = task.start_date;
            }
          }

          if (task.end_date) {
            if (typeof task.end_date === 'string') {
              endDate = new Date(task.end_date);
            } else if (task.end_date instanceof Date) {
              endDate = task.end_date;
            }
          }

          // Compare dates (ignoring time)
          const currentDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
          const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;

          const afterStart = !startDateOnly || currentDateOnly >= startDateOnly;
          const beforeEnd = !endDateOnly || currentDateOnly <= endDateOnly;

          return afterStart && beforeEnd;
        }
      });

      // Fetch task assignments for the current user and date
      const assignments = await taskAssignmentsService.getByMemberAndDate(member.id, dateStr);

      // Combine tasks with assignments
      const tasksWithAssignments: TaskWithAssignment[] = filteredTasks
        .filter((task: Task) => {
          // If assigned_members is null, show to all members
          if (!task.assigned_members || task.assigned_members.length === 0) {
            return true;
          }
          // If user is admin, show all tasks
          if (isAdmin) {
            return true;
          }
          // Otherwise, only show if member is in assigned_members
          return task.assigned_members.includes(member.id);
        })
        .map((task: Task) => {
          const assignment = (assignments || []).find(
            (a: TaskAssignment) => a.task_id === task.id
          );

          return {
            ...task,
            assignment,
          };
        });

      setTasks(tasksWithAssignments);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDate, user, member]);

  const updateTaskCompletion = async (
    taskId: string, 
    isCompleted: boolean, 
    aiCountValue?: string
  ) => {
    if (!user || !member) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Check if assignment exists
      const existingAssignments = await taskAssignmentsService.getByMemberAndDate(member.id, dateStr);
      const existingAssignment = existingAssignments.find(a => a.task_id === taskId);

      if (existingAssignment) {
        // Update existing assignment
        await taskAssignmentsService.update(existingAssignment.id, {
          completion_status: isCompleted ? 'completed' : 'pending',
          ai_count_value: aiCountValue || null,
          completed_at: isCompleted ? Timestamp.now() : null,
        });
      } else {
        // Create new assignment
        await taskAssignmentsService.create({
          task_id: taskId,
          member_id: member.id,
          assigned_date: dateStr,
          completion_status: isCompleted ? 'completed' : 'pending',
          ai_count_value: aiCountValue || null,
          completed_at: isCompleted ? Timestamp.now() : null,
        });
      }

      // Refresh tasks
      await fetchTasks();
    } catch (err: any) {
      console.error('Error updating task completion:', err);
      throw err;
    }
  };

  const createTask = async (taskData: {
    task_title: string;
    task_description?: string;
    remarks?: string;
    task_type: 'permanent' | 'additional';
    requires_ai_count?: boolean;
    weekdays?: string[];
    start_date?: string;
    end_date?: string;
  }) => {
    if (!isAdmin || !member) {
      throw new Error('Only admins can create tasks');
    }

    try {
      const data = await tasksService.create({
        ...taskData,
        organization_id: member.organization_id,
        assigned_by_admin: user?.id || null,
        requires_ai_count: taskData.requires_ai_count || false,
        task_description: taskData.task_description || null,
        remarks: taskData.remarks || null,
        weekdays: taskData.weekdays || null,
        start_date: taskData.start_date || null,
        end_date: taskData.end_date || null,
      });

      await fetchTasks();
      return data;
    } catch (err: any) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!isAdmin) {
      throw new Error('Only admins can update tasks');
    }

    try {
      await tasksService.update(taskId, updates);
      await fetchTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can delete tasks');
    }

    try {
      await tasksService.delete(taskId);
      await fetchTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    updateTaskCompletion,
    createTask,
    updateTask,
    deleteTask,
  };
};

export const useTaskStats = (selectedDate: Date) => {
  const { tasks, isLoading } = useTasks(selectedDate);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.assignment?.completion_status === 'completed').length;
  const pendingTasks = totalTasks - doneTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const doneTasksList = tasks.filter(t => t.assignment?.completion_status === 'completed');
  const pendingTasksList = tasks.filter(t => t.assignment?.completion_status !== 'completed');

  return {
    totalTasks,
    doneTasks,
    pendingTasks,
    completionPercentage,
    doneTasksList,
    pendingTasksList,
    isLoading,
  };
};
