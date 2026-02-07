import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar, 
  Brain,
  RotateCcw
} from 'lucide-react';
import { format, addYears } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, type TaskWithAssignment } from '@/hooks/useTasks';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AddTask: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { createTask, updateTask } = useTasks(new Date());

  // Get edit task from navigation state
  const editTask = (location.state as { editTask?: TaskWithAssignment })?.editTask;
  const isEditing = !!editTask;

  // Form state
  const [taskType, setTaskType] = useState<'permanent' | 'additional'>(
    (editTask?.task_type as 'permanent' | 'additional') || 'permanent'
  );
  const [title, setTitle] = useState(editTask?.task_title || '');
  const [description, setDescription] = useState(editTask?.task_description || '');
  const [remarks, setRemarks] = useState(editTask?.remarks || '');
  const [requiresAiCount, setRequiresAiCount] = useState(editTask?.requires_ai_count || false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    editTask?.weekdays || []
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    editTask?.start_date ? new Date(editTask.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editTask?.end_date ? new Date(editTask.end_date) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const today = new Date();
  const maxDate = addYears(today, 1);

  const handleWeekdayToggle = (day: string) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Task title is required';
    if (title.length > 100) return 'Title must be less than 100 characters';
    
    if (taskType === 'permanent') {
      if (selectedWeekdays.length === 0) return 'Select at least one weekday';
    } else {
      if (startDate && endDate && startDate > endDate) {
        return 'End date must be after start date';
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const taskData = {
        task_title: title.trim(),
        task_description: description.trim() || undefined,
        remarks: remarks.trim() || undefined,
        task_type: taskType as 'permanent' | 'additional',
        requires_ai_count: requiresAiCount,
        weekdays: taskType === 'permanent' ? selectedWeekdays : undefined,
        start_date: taskType === 'additional' && startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        end_date: taskType === 'additional' && endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      };

      if (isEditing && editTask) {
        await updateTask(editTask.id, taskData);
        toast({
          title: 'Task Updated',
          description: 'Task has been updated successfully',
        });
      } else {
        await createTask(taskData);
        toast({
          title: 'Task Created',
          description: 'New task has been created successfully',
        });
      }

      navigate('/tasks');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-surface pb-20 safe-area-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 pt-6 pb-4"
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </h1>
        </div>
      </motion.header>

      {/* Form */}
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Task Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Task Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={taskType}
                onValueChange={(v) => setTaskType(v as 'permanent' | 'additional')}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem
                    value="permanent"
                    id="permanent"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="permanent"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    )}
                  >
                    <RotateCcw className="w-5 h-5 mb-2" />
                    <span className="font-medium">Permanent</span>
                    <span className="text-xs text-muted-foreground">Weekly repeat</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="additional"
                    id="additional"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="additional"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    )}
                  >
                    <Calendar className="w-5 h-5 mb-2" />
                    <span className="font-medium">Additional</span>
                    <span className="text-xs text-muted-foreground">Date range</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {title.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional remarks (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                />
              </div>

              {/* AI Count Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <div>
                    <Label htmlFor="ai-count" className="cursor-pointer">
                      Requires AI Count
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Users must enter AI count to complete
                    </p>
                  </div>
                </div>
                <Switch
                  id="ai-count"
                  checked={requiresAiCount}
                  onCheckedChange={setRequiresAiCount}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Permanent Task - Weekday Selection */}
        {taskType === 'permanent' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Weekdays</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Select days when this task should appear
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={selectedWeekdays.includes(day)}
                        onCheckedChange={() => handleWeekdayToggle(day)}
                      />
                      <Label htmlFor={day} className="text-sm cursor-pointer">
                        {day.slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Additional Task - Date Range */}
        {taskType === 'additional' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          {startDate ? format(startDate, 'MMM d, yyyy') : 'Optional'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < today || date > maxDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          {endDate ? format(endDate, 'MMM d, yyyy') : 'Optional'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => 
                            date < (startDate || today) || date > maxDate
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Task' : 'Create Task'}
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddTask;