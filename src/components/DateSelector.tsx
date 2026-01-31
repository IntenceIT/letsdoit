import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isToday, isFuture, startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = startOfDay(new Date());
  const isTodaySelected = isToday(selectedDate);
  const canGoForward = !isFuture(selectedDate);

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    if (canGoForward) {
      const nextDay = addDays(selectedDate, 1);
      if (!isFuture(nextDay)) {
        onDateChange(nextDay);
      }
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date && !isFuture(date)) {
      onDateChange(date);
      setIsCalendarOpen(false);
    }
  };

  const handleGoToToday = () => {
    onDateChange(today);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-card border-border/50 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            {/* Previous day button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevDay}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Date display */}
            <div className="flex-1 text-center">
              <button
                onClick={handleGoToToday}
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-medium mb-1 transition-colors",
                  isTodaySelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {isTodaySelected ? 'Today' : 'Go to Today'}
              </button>
              <p className="text-lg font-semibold text-foreground">
                {format(selectedDate, 'EEEE')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>

            {/* Next day button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              disabled={!canGoForward || isTodaySelected}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar button */}
          <div className="flex justify-center mt-3">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Pick a date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  disabled={(date) => isFuture(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DateSelector;
