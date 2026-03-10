import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, type TaskWithAssignment } from '@/hooks/useTasks';
import BottomNav from '@/components/BottomNav';
import TaskCard from '@/components/TaskCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isBefore, startOfDay, addDays, subDays } from 'date-fns';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { tasks, isLoading, error, updateTaskCompletion, deleteTask } = useTasks(selectedDate);

  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const isTodaySelected = isToday(selectedDate);

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  // Filter and sort tasks - pending first, completed last
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.task_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === 'done') {
        return matchesSearch && task.assignment?.completion_status === 'completed';
      }
      if (filter === 'pending') {
        return matchesSearch && task.assignment?.completion_status !== 'completed';
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      const aCompleted = a.assignment?.completion_status === 'completed';
      const bCompleted = b.assignment?.completion_status === 'completed';
      
      // Pending tasks (false) come before completed tasks (true)
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });

  const handleComplete = async (taskId: string, isCompleted: boolean, aiCountValue?: string) => {
    // Only allow marking tasks as done for TODAY
    if (!isTodaySelected) {
      toast({
        title: 'Cannot Update Tasks',
        description: 'You can only mark tasks as done for today',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateTaskCompletion(taskId, isCompleted, aiCountValue);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (task: TaskWithAssignment) => {
    navigate('/add-task', { state: { editTask: task } });
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      toast({
        title: 'Task Deleted',
        description: 'The task has been deleted successfully',
      });
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
          {/* Title and Date Picker Row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">View Tasks</h1>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Calendar className="h-4 w-4" />
                    Pick Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Date Display */}
          <div className="text-center mb-4">
            {isTodaySelected && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
                Today
              </span>
            )}
            {!isTodaySelected && (
              <span 
                className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full mb-2 cursor-pointer hover:bg-orange-200 transition-colors"
                onClick={handleTodayClick}
              >
                View Only - Cannot Edit
              </span>
            )}
            <h2 
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={handleTodayClick}
            >
              {format(selectedDate, 'EEEE')}
            </h2>
            <p 
              className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={handleTodayClick}
            >
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>

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

      {/* Task List */}
      <div className="px-4 pt-6 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-destructive">{error}</p>
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
                  key={`${task.id}-${selectedDate.toISOString()}`}
                  task={task}
                  selectedDate={selectedDate}
                  onComplete={handleComplete}
                  onEdit={isAdmin ? handleEdit : undefined}
                  onDelete={isAdmin ? (id) => setTaskToDelete(id) : undefined}
                  isToday={isTodaySelected}
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
              onClick={handleDeleteConfirm}
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