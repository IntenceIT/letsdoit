import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

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

const TASKS_STORAGE_KEY = 'app_tasks';
const COMPLETIONS_STORAGE_KEY = 'app_task_completions';

const WEEKDAY_MAP: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
};

// Helper functions for localStorage
export const getStoredTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const setStoredTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

export const getStoredCompletions = (): TaskCompletion[] => {
  try {
    const stored = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const setStoredCompletions = (completions: TaskCompletion[]) => {
  localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
};

export const addTask = (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
  const tasks = getStoredTasks();
  const newTask: Task = {
    ...task,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  tasks.push(newTask);
  setStoredTasks(tasks);
  return newTask;
};

export const updateTask = (taskId: string, updates: Partial<Task>): Task | null => {
  const tasks = getStoredTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return null;
  
  tasks[index] = {
    ...tasks[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  setStoredTasks(tasks);
  return tasks[index];
};

export const deleteTask = (taskId: string): boolean => {
  const tasks = getStoredTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  if (filtered.length === tasks.length) return false;
  
  setStoredTasks(filtered);
  
  // Also delete related completions
  const completions = getStoredCompletions();
  const filteredCompletions = completions.filter(c => c.task_id !== taskId);
  setStoredCompletions(filteredCompletions);
  
  return true;
};

export const resetTaskCompletions = (taskId: string) => {
  const completions = getStoredCompletions();
  const updated = completions.map(c => {
    if (c.task_id === taskId) {
      return {
        ...c,
        is_completed: false,
        ai_count_value: null,
        completed_at: null,
      };
    }
    return c;
  });
  setStoredCompletions(updated);
};

export const useTasks = (selectedDate: Date) => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      const dayName = Object.keys(WEEKDAY_MAP).find(key => WEEKDAY_MAP[key] === dayOfWeek) || '';

      const allTasks = getStoredTasks();
      const allCompletions = getStoredCompletions();

      // Filter tasks based on type and date
      const filteredTasks = allTasks.filter((task: Task) => {
        if (task.task_type === 'permanent') {
          return task.weekdays.includes(dayName);
        } else {
          const startDate = task.start_date ? parseISO(task.start_date) : null;
          const endDate = task.end_date ? parseISO(task.end_date) : null;
          const currentDate = selectedDate;

          const afterStart = !startDate || currentDate >= startDate;
          const beforeEnd = !endDate || currentDate <= endDate;

          const isAssigned = task.assigned_users.length === 0 || 
                           task.assigned_users.includes(user.id) ||
                           isAdmin;

          return afterStart && beforeEnd && isAssigned;
        }
      });

      // Get user profiles from localStorage for completed user names
      const getStoredProfiles = () => {
        try {
          const stored = localStorage.getItem('app_members');
          return stored ? JSON.parse(stored) : [];
        } catch {
          return [];
        }
      };

      const profiles = getStoredProfiles();
      const profilesMap: Record<string, string> = profiles.reduce((acc: Record<string, string>, p: { user_id: string; full_name: string }) => {
        acc[p.user_id] = p.full_name;
        return acc;
      }, {});

      // Combine tasks with completions
      const tasksWithCompletions: TaskWithCompletion[] = filteredTasks.map((task: Task) => {
        const completion = allCompletions.find(
          (c: TaskCompletion) => c.task_id === task.id && c.user_id === user.id && c.completion_date === dateStr
        );
        const anyCompletion = allCompletions.find(
          (c: TaskCompletion) => c.task_id === task.id && c.is_completed && c.completion_date === dateStr
        );

        return {
          ...task,
          completion,
          completedByUser: anyCompletion ? profilesMap[anyCompletion.user_id] : undefined,
        };
      });

      setTasks(tasksWithCompletions);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, user, isAdmin]);

  const refetch = () => {
    // Trigger re-render by updating a dependency - we'll use a workaround
    setIsLoading(true);
    setTimeout(() => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      const dayName = Object.keys(WEEKDAY_MAP).find(key => WEEKDAY_MAP[key] === dayOfWeek) || '';

      const allTasks = getStoredTasks();
      const allCompletions = getStoredCompletions();

      const filteredTasks = allTasks.filter((task: Task) => {
        if (task.task_type === 'permanent') {
          return task.weekdays.includes(dayName);
        } else {
          const startDate = task.start_date ? parseISO(task.start_date) : null;
          const endDate = task.end_date ? parseISO(task.end_date) : null;
          const currentDate = selectedDate;

          const afterStart = !startDate || currentDate >= startDate;
          const beforeEnd = !endDate || currentDate <= endDate;

          const isAssigned = !user || task.assigned_users.length === 0 || 
                           task.assigned_users.includes(user.id) ||
                           isAdmin;

          return afterStart && beforeEnd && isAssigned;
        }
      });

      const getStoredProfiles = () => {
        try {
          const stored = localStorage.getItem('app_members');
          return stored ? JSON.parse(stored) : [];
        } catch {
          return [];
        }
      };

      const profiles = getStoredProfiles();
      const profilesMap: Record<string, string> = profiles.reduce((acc: Record<string, string>, p: { user_id: string; full_name: string }) => {
        acc[p.user_id] = p.full_name;
        return acc;
      }, {});

      const tasksWithCompletions: TaskWithCompletion[] = filteredTasks.map((task: Task) => {
        const completion = allCompletions.find(
          (c: TaskCompletion) => c.task_id === task.id && c.user_id === user?.id && c.completion_date === dateStr
        );
        const anyCompletion = allCompletions.find(
          (c: TaskCompletion) => c.task_id === task.id && c.is_completed && c.completion_date === dateStr
        );

        return {
          ...task,
          completion,
          completedByUser: anyCompletion ? profilesMap[anyCompletion.user_id] : undefined,
        };
      });

      setTasks(tasksWithCompletions);
      setIsLoading(false);
    }, 0);
  };

  const updateTaskCompletion = (
    taskId: string, 
    isCompleted: boolean, 
    aiCountValue?: string
  ) => {
    if (!user) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const now = new Date().toISOString();

    const completions = getStoredCompletions();
    const existingIndex = completions.findIndex(
      c => c.task_id === taskId && c.user_id === user.id && c.completion_date === dateStr
    );

    if (existingIndex !== -1) {
      completions[existingIndex] = {
        ...completions[existingIndex],
        is_completed: isCompleted,
        ai_count_value: aiCountValue || null,
        completed_at: isCompleted ? now : null,
      };
    } else {
      completions.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        task_id: taskId,
        user_id: user.id,
        completion_date: dateStr,
        is_completed: isCompleted,
        ai_count_value: aiCountValue || null,
        completed_at: isCompleted ? now : null,
      });
    }

    setStoredCompletions(completions);
    refetch();
  };

  return {
    tasks,
    isLoading,
    error,
    refetch,
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
