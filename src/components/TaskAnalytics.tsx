import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DailyData {
  date: string;
  completed: number;
  total: number;
}

interface TaskAnalyticsProps {
  weeklyData: DailyData[];
  monthlyData: DailyData[];
  onExport: () => void;
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({
  weeklyData,
  monthlyData,
  onExport,
}) => {
  const [view, setView] = useState<'week' | 'month'>('week');

  const data = view === 'week' ? weeklyData : monthlyData;

  const completionRate = data.length > 0
    ? (data.reduce((sum, d) => sum + d.completed, 0) / data.reduce((sum, d) => sum + d.total, 0) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance Analytics
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Rate */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium">Completion Rate</span>
          </div>
          <span className="text-2xl font-bold text-primary">{completionRate}%</span>
        </div>

        {/* Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'month')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">Last 7 Days</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="month" className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaskAnalytics;
