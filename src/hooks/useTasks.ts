import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import type { Task, TaskAssignment, Member } from '@/integrations/supabase/types';

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
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', member.organization_id);

      if (tasksError) throw tasksError;

      // Filter tasks based on type and date
      const filteredTasks = (allTasks || []).filter((task: Task) => {
        if (task.task_type === 'permanent') {
          return task.weekdays?.includes(dayName);
        } else {
          const startDate = task.start_date ? new Date(task.start_date) : null;
          const endDate = task.end_date ? new Date(task.end_date) : null;
          const currentDate = selectedDate;

          const afterStart = !startDate || currentDate >= startDate;
          const beforeEnd = !endDate || currentDate <= endDate;

          return afterStart && beforeEnd;
        }
      });

      // Fetch task assignments for the current user and date
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('member_id', member.id)
        .eq('assigned_date', dateStr)
        .in('task_id', filteredTasks.map(t => t.id));

      if (assignmentsError) throw assignmentsError;

      // Fetch all assignments for the date to see who completed tasks
      const { data: allAssignments, error: allAssignmentsError } = await supabase
        .from('task_assignments')
        .select(`
          *,
          members!inner(full_name)
        `)
        .eq('assigned_date', dateStr)
        .eq('completion_status', 'completed')
        .in('task_id', filteredTasks.map(t => t.id));

      if (allAssignmentsError) throw allAssignmentsError;

      // Create a map of completed tasks to user names
      const completedByMap: Record<string, string> = {};
      (allAssignments || []).forEach((assignment: any) => {
        completedByMap[assignment.task_id] = assignment.members.full_name;
      });

      // Combine tasks with assignments
      const tasksWithAssignments: TaskWithAssignment[] = filteredTasks.map((task: Task) => {
        const assignment = (assignments || []).find(
          (a: TaskAssignment) => a.task_id === task.id
        );

        return {
          ...task,
          assignment,
          completedByUser: completedByMap[task.id],
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
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('task_assignments')
        .upsert({
          task_id: taskId,
          member_id: member.id,
          assigned_date: dateStr,
          completion_status: isCompleted ? 'completed' : 'pending',
          ai_count_value: aiCountValue || null,
          completed_at: isCompleted ? now : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, assignment: data }
          : task
      ));
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
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          organization_id: member.organization_id,
          assigned_by_admin: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      await fetchTasks();
      return data;
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

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
