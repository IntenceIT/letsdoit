import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, CheckCircle2, Clock, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStats } from '@/hooks/useTasks';
import BottomNav from '@/components/BottomNav';
import StatCard from '@/components/StatCard';
import CompletionChart from '@/components/CompletionChart';
import TaskListPopup from '@/components/TaskListPopup';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isToday } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDonePopup, setShowDonePopup] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    totalTasks,
    doneTasks,
    pendingTasks,
    completionPercentage,
    doneTasksList,
    pendingTasksList,
    isLoading,
  } = useTaskStats(selectedDate);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-surface pb-20 safe-area-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero text-white px-4 pt-6 pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white/80 text-sm">{greeting()}</p>
              <h1 className="text-2xl font-bold">
                {user?.full_name || 'User'}
              </h1>
            </div>
            {isAdmin && (
              <span className="px-3 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur-sm">
                Admin
              </span>
            )}
          </div>
          <p className="text-white/70 text-sm">
            Let's check your tasks for today
          </p>
        </div>
      </motion.header>

      {/* Content */}
      <div className="px-4 -mt-4 max-w-lg mx-auto space-y-4">
        {/* Today's Date Display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {isToday(selectedDate) ? "Today's Tasks" : "Tasks for"}
              </p>
              <h2 
                className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={handleTodayClick}
              >
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 ml-2"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* Stats - Total with Done/Pending Breakdown */}
        {isLoading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <ListTodo className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {totalTasks}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">{doneTasks}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">{pendingTasks}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion Chart */}
        {isLoading ? (
          <Skeleton className="h-60 rounded-xl" />
        ) : (
          <CompletionChart
            completionPercentage={completionPercentage}
            doneTasks={doneTasks}
            pendingTasks={pendingTasks}
          />
        )}

        {/* Task Status Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Tasks Done Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setShowDonePopup(true)}
              className="bg-card rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all border border-success/20"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-success">Tasks Done</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    View Details →
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tasks Pending Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowPendingPopup(true)}
              className="bg-card rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all border border-warning/20"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-warning">Tasks Pending</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    View Details →
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </motion.div>
      </div>

      {/* Task List Popups */}
      <TaskListPopup
        isOpen={showDonePopup}
        onClose={() => setShowDonePopup(false)}
        title="Completed Tasks"
        tasks={doneTasksList}
        type="done"
      />
      <TaskListPopup
        isOpen={showPendingPopup}
        onClose={() => setShowPendingPopup(false)}
        title="Pending Tasks"
        tasks={pendingTasksList}
        type="pending"
      />

      <BottomNav />
    </div>
  );
};

export default Dashboard;
