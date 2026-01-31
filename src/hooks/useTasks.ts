import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, parseISO } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  remarks: string | null;
  task_type: 'permanent' | 'additional';
  requires_ai_count: boolean;
  weekdays: string[];
  start_date: string | null;
  end_date: string | null;
  assigned_users: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;
  is_completed: boolean;
  ai_count_value: string | null;
  completed_at: string | null;
}

export interface TaskWithCompletion extends Task {
  completion?: TaskCompletion;
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
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      const dayName = Object.keys(WEEKDAY_MAP).find(key => WEEKDAY_MAP[key] === dayOfWeek) || '';

      // Fetch all tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Filter tasks based on type and date
      const filteredTasks = (allTasks || []).filter((task: Task) => {
        if (task.task_type === 'permanent') {
          // Permanent tasks show on matching weekdays
          return task.weekdays.includes(dayName);
        } else {
          // Additional tasks show within date range
          const startDate = task.start_date ? parseISO(task.start_date) : null;
          const endDate = task.end_date ? parseISO(task.end_date) : null;
          const currentDate = selectedDate;

          const afterStart = !startDate || currentDate >= startDate;
          const beforeEnd = !endDate || currentDate <= endDate;

          // Check if user is assigned (or if admin viewing all)
          const isAssigned = task.assigned_users.length === 0 || 
                           task.assigned_users.includes(user.id) ||
                           isAdmin;

          return afterStart && beforeEnd && isAssigned;
        }
      });

      // Fetch completions for these tasks on selected date
      const taskIds = filteredTasks.map((t: Task) => t.id);
      
      if (taskIds.length > 0) {
        const { data: completions, error: completionsError } = await supabase
          .from('task_completions')
          .select('*')
          .in('task_id', taskIds)
          .eq('completion_date', dateStr);

        if (completionsError) throw completionsError;

        // Fetch profiles for completed users
        const completedUserIds = [...new Set((completions || []).filter(c => c.is_completed).map(c => c.user_id))];
        let profilesMap: Record<string, string> = {};

        if (completedUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', completedUserIds);

          profilesMap = (profiles || []).reduce((acc: Record<string, string>, p: { user_id: string; full_name: string }) => {
            acc[p.user_id] = p.full_name;
            return acc;
          }, {});
        }

        // Combine tasks with completions
        const tasksWithCompletions: TaskWithCompletion[] = filteredTasks.map((task: Task) => {
          const completion = (completions || []).find(
            (c: TaskCompletion) => c.task_id === task.id && c.user_id === user.id
          );
          const anyCompletion = (completions || []).find(
            (c: TaskCompletion) => c.task_id === task.id && c.is_completed
          );

          return {
            ...task,
            completion,
            completedByUser: anyCompletion ? profilesMap[anyCompletion.user_id] : undefined,
          };
        });

        setTasks(tasksWithCompletions);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskCompletion = async (
    taskId: string, 
    isCompleted: boolean, 
    aiCountValue?: string
  ) => {
    if (!user) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const now = new Date().toISOString();

    try {
      // Check if completion record exists
      const { data: existing } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('completion_date', dateStr)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('task_completions')
          .update({
            is_completed: isCompleted,
            ai_count_value: aiCountValue || null,
            completed_at: isCompleted ? now : null,
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('task_completions')
          .insert({
            task_id: taskId,
            user_id: user.id,
            completion_date: dateStr,
            is_completed: isCompleted,
            ai_count_value: aiCountValue || null,
            completed_at: isCompleted ? now : null,
          });
      }

      await fetchTasks();
    } catch (err) {
      console.error('Error updating task completion:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDate, user]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    updateTaskCompletion,
  };
};

export const useTaskStats = (selectedDate: Date) => {
  const { tasks, isLoading } = useTasks(selectedDate);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.completion?.is_completed).length;
  const pendingTasks = totalTasks - doneTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const doneTasksList = tasks.filter(t => t.completion?.is_completed);
  const pendingTasksList = tasks.filter(t => !t.completion?.is_completed);

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
