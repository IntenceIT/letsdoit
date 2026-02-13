import { useState, useEffect, useMemo, useCallback } from 'react';
import { tasksService, taskAssignmentsService, membersService } from '@/integrations/firebase/firestore';
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
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const dayName = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    return Object.keys(WEEKDAY_MAP).find(key => WEEKDAY_MAP[key] === dayOfWeek) || '';
  }, [selectedDate]);

  // Memoized filtered and processed tasks
  const processedTasks = useMemo(() => {
    if (!member || allTasks.length === 0) return [];

    console.log(`Processing tasks for ${dateStr}, member: ${member.id}`);
    console.log(`Total tasks: ${allTasks.length}, Total assignments: ${assignments.length}`);

    // Filter tasks based on type and date
    const filteredTasks = allTasks.filter((task: Task) => {
      if (task.task_type === 'permanent') {
        return task.weekdays?.includes(dayName);
      } else {
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (task.start_date) {
          if (typeof task.start_date === 'string') {
            startDate = new Date(task.start_date);
          } else if (task.start_date && typeof task.start_date === 'object' && 'toDate' in task.start_date) {
            startDate = (task.start_date as any).toDate();
          } else {
            startDate = task.start_date as Date;
          }
        }

        if (task.end_date) {
          if (typeof task.end_date === 'string') {
            endDate = new Date(task.end_date);
          } else if (task.end_date && typeof task.end_date === 'object' && 'toDate' in task.end_date) {
            endDate = (task.end_date as any).toDate();
          } else {
            endDate = task.end_date as Date;
          }
        }

        const currentDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
        const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;

        const afterStart = !startDateOnly || currentDateOnly >= startDateOnly;
        const beforeEnd = !endDateOnly || currentDateOnly <= endDateOnly;

        return afterStart && beforeEnd;
      }
    });

    console.log(`Filtered tasks for ${dayName}: ${filteredTasks.length}`);

    // Filter by member assignment and add assignment status
    const tasksWithAssignments: TaskWithAssignment[] = filteredTasks
      .filter((task: Task) => {
        if (!task.assigned_members || task.assigned_members.length === 0) {
          return true;
        }
        if (isAdmin) {
          return true;
        }
        return task.assigned_members.includes(member.id);
      })
      .map((task: Task) => {
        // Find assignments that match BOTH task_id AND assigned_date
        const taskAssignments = assignments.filter(
          a => a.task_id === task.id && a.assigned_date === dateStr
        );

        console.log(`Task ${task.id}: Found ${taskAssignments.length} assignments for date ${dateStr}`);

        // Find if ANY member completed this task on THIS DATE
        const completedAssignment = taskAssignments.find(
          (a: TaskAssignment) => a.completion_status === 'completed'
        );

        // Find current user's assignment for THIS DATE
        const userAssignment = taskAssignments.find(
          (a: TaskAssignment) => a.member_id === member.id
        );

        // Use completed assignment if exists, otherwise user's assignment
        const finalAssignment = completedAssignment || userAssignment;

        if (finalAssignment) {
          console.log(`Task ${task.id} assignment status: ${finalAssignment.completion_status}`);
        }

        return {
          ...task,
          assignment: finalAssignment,
        };
      });

    console.log(`Final tasks with assignments: ${tasksWithAssignments.length}`);
    
    // Sort tasks: today_only tasks first, then by completion status
    return tasksWithAssignments.sort((a, b) => {
      // Today only tasks come first
      if (a.today_only && !b.today_only) return -1;
      if (!a.today_only && b.today_only) return 1;
      
      // Then sort by completion status (pending first)
      const aCompleted = a.assignment?.completion_status === 'completed';
      const bCompleted = b.assignment?.completion_status === 'completed';
      if (!aCompleted && bCompleted) return -1;
      if (aCompleted && !bCompleted) return 1;
      
      return 0;
    });
  }, [allTasks, assignments, selectedDate, dayName, dateStr, member, isAdmin]);

  // Update tasks when processed tasks change
  useEffect(() => {
    setTasks(processedTasks);
  }, [processedTasks]);

  useEffect(() => {
    if (!user || !member) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time listener for tasks
    const unsubscribeTasks = tasksService.subscribeToOrganization(
      member.organization_id,
      (fetchedTasks) => {
        console.log(`Received ${fetchedTasks.length} tasks from Firestore`);
        setAllTasks(fetchedTasks);
        setIsLoading(false);
      }
    );

    // Set up real-time listener for task assignments
    const unsubscribeAssignments = taskAssignmentsService.subscribeToDate(
      dateStr,
      (fetchedAssignments) => {
        console.log(`Received ${fetchedAssignments.length} assignments for ${dateStr}`);
        setAssignments(fetchedAssignments);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeAssignments();
    };
  }, [dateStr, user, member]);

  const updateTaskCompletion = useCallback(async (
    taskId: string, 
    isCompleted: boolean, 
    aiCountValue?: string
  ) => {
    if (!user || !member) {
      console.error('No user or member');
      return;
    }

    console.log(`Updating task ${taskId}: isCompleted=${isCompleted}, date=${dateStr}`);

    try {
      // Find assignment for THIS task on THIS date for THIS user
      const existingAssignment = assignments.find(
        a => a.task_id === taskId && 
             a.member_id === member.id && 
             a.assigned_date === dateStr
      );

      console.log(`Existing assignment for task ${taskId}:`, existingAssignment);

      // CRITICAL FIX: Properly handle completion status toggle
      const assignmentData: any = {
        completion_status: isCompleted ? ('completed' as const) : ('pending' as const),
      };

      // Only set these fields when marking as completed
      if (isCompleted) {
        assignmentData.ai_count_value = aiCountValue || null;
        assignmentData.completed_at = Timestamp.now();
      } else {
        // Explicitly clear these fields when marking as pending
        assignmentData.ai_count_value = null;
        assignmentData.completed_at = null;
      }

      if (existingAssignment) {
        console.log(`Updating existing assignment ${existingAssignment.id} to ${assignmentData.completion_status}`);
        await taskAssignmentsService.update(existingAssignment.id, assignmentData);
        console.log(`Successfully updated assignment ${existingAssignment.id}`);
      } else {
        console.log(`Creating new assignment for task ${taskId}`);
        await taskAssignmentsService.create({
          task_id: taskId,
          member_id: member.id,
          assigned_date: dateStr,
          ...assignmentData,
        });
        console.log(`Successfully created new assignment`);
      }

      console.log(`Task ${taskId} update complete`);
    } catch (err: any) {
      console.error('Error updating task completion:', err);
      throw err;
    }
  }, [user, member, dateStr, assignments]);

  const createTask = useCallback(async (taskData: {
    task_title: string;
    task_description?: string;
    remarks?: string;
    task_type: 'permanent' | 'additional';
    requires_ai_count?: boolean;
    weekdays?: string[];
    start_date?: string;
    end_date?: string;
    today_only?: boolean;
    assigned_members?: string[] | null;
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
        today_only: taskData.today_only || false,
        assigned_members: taskData.assigned_members || null,
      });

      return data;
    } catch (err: any) {
      console.error('Error creating task:', err);
      throw err;
    }
  }, [isAdmin, member, user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!isAdmin) {
      throw new Error('Only admins can update tasks');
    }

    try {
      await tasksService.update(taskId, updates);
    } catch (err: any) {
      console.error('Error updating task:', err);
      throw err;
    }
  }, [isAdmin]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can delete tasks');
    }

    try {
      await tasksService.delete(taskId);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }, [isAdmin]);

  return {
    tasks,
    isLoading,
    error,
    updateTaskCompletion,
    createTask,
    updateTask,
    deleteTask,
    refetch: () => {
      console.log('Refetch requested - real-time listeners will update automatically');
    },
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