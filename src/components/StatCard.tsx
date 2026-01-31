import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'primary';
  onClick?: () => void;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'default',
  onClick,
  delay = 0,
}) => {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/10 border-success/30',
    warning: 'bg-warning/10 border-warning/30',
    primary: 'bg-primary/10 border-primary/30',
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-muted',
    success: 'text-success bg-success/20',
    warning: 'text-warning bg-warning/20',
    primary: 'text-primary bg-primary/20',
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    primary: 'text-primary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card
        className={cn(
          "stat-card cursor-pointer border",
          variantStyles[variant],
          onClick && "hover:shadow-lg active:scale-[0.98]"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", iconStyles[variant])}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <p className={cn("text-2xl font-bold", valueStyles[variant])}>
                {value}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
