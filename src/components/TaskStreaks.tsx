import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TaskStreaksProps {
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  weeklyAverage: number;
}

const TaskStreaks: React.FC<TaskStreaksProps> = ({
  currentStreak,
  longestStreak,
  totalTasksCompleted,
  weeklyAverage,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Your Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Streak */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/20">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
          {currentStreak >= 7 && (
            <Badge variant="secondary" className="gap-1">
              <Trophy className="w-3 h-3" />
              On Fire!
            </Badge>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
            <p className="text-xs text-muted-foreground">Best</p>
            <p className="text-lg font-bold">{longestStreak}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-blue-600" />
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalTasksCompleted}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-muted-foreground">Weekly</p>
            <p className="text-lg font-bold">{weeklyAverage.toFixed(1)}</p>
          </div>
        </div>

        {/* Motivational Message */}
        {currentStreak === 0 && (
          <p className="text-xs text-center text-muted-foreground italic">
            Complete all tasks today to start your streak! 🎯
          </p>
        )}
        {currentStreak >= 1 && currentStreak < 7 && (
          <p className="text-xs text-center text-muted-foreground italic">
            Keep going! You're building momentum 💪
          </p>
        )}
        {currentStreak >= 7 && (
          <p className="text-xs text-center text-orange-600 font-medium">
            Amazing! You're on a {currentStreak}-day streak! 🔥
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskStreaks;
