import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompletionChartProps {
  completionPercentage: number;
  doneTasks: number;
  pendingTasks: number;
}

const CompletionChart: React.FC<CompletionChartProps> = ({
  completionPercentage,
  doneTasks,
  pendingTasks,
}) => {
  const data = [
    { name: 'Done', value: doneTasks, color: 'hsl(145, 65%, 45%)' },
    { name: 'Pending', value: pendingTasks, color: 'hsl(35, 90%, 55%)' },
  ];

  // Ensure we always have data to display
  const chartData = doneTasks === 0 && pendingTasks === 0 
    ? [{ name: 'No Tasks', value: 1, color: 'hsl(var(--muted))' }]
    : data;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="bg-gradient-card border-border/50 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-center">
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {completionPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">Complete</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">
                Done ({doneTasks})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">
                Pending ({pendingTasks})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CompletionChart;
