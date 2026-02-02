import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStats } from '@/hooks/useTasks';
import BottomNav from '@/components/BottomNav';
import DateSelector from '@/components/DateSelector';
import StatCard from '@/components/StatCard';
import CompletionChart from '@/components/CompletionChart';
import TaskListPopup from '@/components/TaskListPopup';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDonePopup, setShowDonePopup] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);

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
        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              title="Total"
              value={totalTasks}
              icon={ListTodo}
              variant="primary"
              delay={0}
            />
            <StatCard
              title="Done"
              value={doneTasks}
              icon={CheckCircle2}
              variant="success"
              onClick={() => setShowDonePopup(true)}
              delay={0.1}
            />
            <StatCard
              title="Pending"
              value={pendingTasks}
              icon={Clock}
              variant="warning"
              onClick={() => setShowPendingPopup(true)}
              delay={0.2}
            />
          </div>
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
