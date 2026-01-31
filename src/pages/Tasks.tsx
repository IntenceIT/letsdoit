import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, TaskWithCompletion } from '@/hooks/useTasks';
import BottomNav from '@/components/BottomNav';
import TaskCard from '@/components/TaskCard';
import DateSelector from '@/components/DateSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const { tasks, isLoading, error, refetch, updateTaskCompletion } = useTasks(selectedDate);

  // Filter tasks based on search and status filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'done') {
      return matchesSearch && task.completion?.is_completed;
    }
    if (filter === 'pending') {
      return matchesSearch && !task.completion?.is_completed;
    }
    return matchesSearch;
  });

  const handleComplete = async (taskId: string, isCompleted: boolean, aiCountValue?: string) => {
    try {
      await updateTaskCompletion(taskId, isCompleted, aiCountValue);
      toast({
        title: isCompleted ? 'Task Completed' : 'Task Marked Pending',
        description: 'Task status updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (task: TaskWithCompletion) => {
    navigate('/add-task', { state: { editTask: task } });
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete);

      if (error) throw error;

      toast({
        title: 'Task Deleted',
        description: 'The task has been deleted successfully',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setTaskToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface pb-20 safe-area-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 pt-6 pb-4"
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground mb-4">View Tasks</h1>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => value && setFilter(value)}
              className="justify-start"
            >
              <ToggleGroupItem value="all" className="text-xs px-3 h-8">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="done" className="text-xs px-3 h-8">
                Done
              </ToggleGroupItem>
              <ToggleGroupItem value="pending" className="text-xs px-3 h-8">
                Pending
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </motion.header>

      {/* Date Selector */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Task List */}
      <div className="px-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery ? 'No tasks match your search' : 'No tasks for this date'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selectedDate={selectedDate}
                  onComplete={handleComplete}
                  onEdit={isAdmin ? handleEdit : undefined}
                  onDelete={isAdmin ? (id) => setTaskToDelete(id) : undefined}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Tasks;
