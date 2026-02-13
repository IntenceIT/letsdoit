import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar, 
  Brain,
  RotateCcw,
  Users
} from 'lucide-react';
import { format, addYears } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, type TaskWithAssignment } from '@/hooks/useTasks';
import { useMembers } from '@/hooks/useMembers';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { isAdmin } = useAuth();
  const { createTask, updateTask } = useTasks(new Date());
  const { members, loading: membersLoading } = useMembers();

  // Get edit task from navigation state
  const editTask = (location.state as { editTask?: TaskWithAssignment })?.editTask;
  const isEditing = !!editTask;

  // Get approved members only
  const approvedMembers = members.filter(m => m.status === 'approved');

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
    editTask?.start_date ? new Date(editTask.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editTask?.end_date ? new Date(editTask.end_date) : editTask?.start_date ? new Date(editTask.start_date) : new Date()
  );
  const [isTodayOnly, setIsTodayOnly] = useState(editTask?.today_only || false);
  const [assignToAll, setAssignToAll] = useState(
    !editTask?.assigned_members || editTask.assigned_members.length === 0
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    editTask?.assigned_members || []
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

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) 
        ? prev.filter((id) => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const handleTodayOnlyToggle = (checked: boolean) => {
    setIsTodayOnly(checked);
    if (checked) {
      // When "Today Only" is enabled, set both dates to today
      setStartDate(today);
      setEndDate(today);
    }
  };

  const handleAssignToAllToggle = (checked: boolean) => {
    setAssignToAll(checked);
    if (checked) {
      setSelectedMembers([]);
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Task title is required';
    if (title.length > 100) return 'Title must be less than 100 characters';
    
    if (!assignToAll && selectedMembers.length === 0) {
      return 'Select at least one member or assign to all';
    }
    
    if (taskType === 'permanent') {
      if (selectedWeekdays.length === 0) return 'Select at least one weekday';
    } else {
      if (!startDate) return 'Start date is required for additional tasks';
      if (!endDate) return 'End date is required for additional tasks';
      if (startDate && endDate && startDate > endDate) {
        return 'End date must be on or after start date';
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
        task_description: description.trim() || null,
        remarks: remarks.trim() || null,
        task_type: taskType as 'permanent' | 'additional',
        requires_ai_count: requiresAiCount,
        weekdays: taskType === 'permanent' ? selectedWeekdays : null,
        start_date: taskType === 'additional' && startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: taskType === 'additional' && endDate ? format(endDate, 'yyyy-MM-dd') : null,
        today_only: taskType === 'additional' ? isTodayOnly : false,
        assigned_members: assignToAll ? null : selectedMembers,
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTaskType('permanent')}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                    taskType === 'permanent'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <RotateCcw className="w-5 h-5 mb-2" />
                  <span className="font-medium">Permanent</span>
                  <span className="text-xs text-muted-foreground">Weekly repeat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType('additional')}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                    taskType === 'additional'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Calendar className="w-5 h-5 mb-2" />
                  <span className="font-medium">Additional</span>
                  <span className="text-xs text-muted-foreground">Date range</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Task - Date Range (shown before Task Details) */}
        {taskType === 'additional' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today Only Toggle */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <Label htmlFor="today-only" className="cursor-pointer font-medium text-primary">
                        Today Only
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Task will appear only for today with highlighting
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="today-only"
                    checked={isTodayOnly}
                    onCheckedChange={handleTodayOnlyToggle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={isTodayOnly}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                            isTodayOnly && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {startDate ? format(startDate, 'MMM d, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setStartDate(today);
                              if (!endDate || endDate < today) {
                                setEndDate(today);
                              }
                            }}
                          >
                            Today
                          </Button>
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            // Auto-update end date if it's before the new start date
                            if (date && endDate && endDate < date) {
                              setEndDate(date);
                            }
                          }}
                          disabled={(date) => date < today || date > maxDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={isTodayOnly}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                            isTodayOnly && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {endDate ? format(endDate, 'MMM d, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setEndDate(today)}
                            disabled={startDate ? startDate > today : false}
                          >
                            Today
                          </Button>
                        </div>
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
                {!isTodayOnly && (
                  <p className="text-xs text-muted-foreground">
                    Tip: Select the same date for both to create a single-day task
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Task Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: taskType === 'additional' ? 0.15 : 0.1 }}
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

        {/* Member Assignment */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: taskType === 'additional' ? 0.2 : 0.15 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assign To
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assign to All Toggle */}
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <Label htmlFor="assign-all" className="cursor-pointer font-medium">
                    Assign to All Members
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Task will be visible to everyone
                  </p>
                </div>
                <Switch
                  id="assign-all"
                  checked={assignToAll}
                  onCheckedChange={handleAssignToAllToggle}
                />
              </div>

              {/* Individual Member Selection */}
              {!assignToAll && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Select specific members ({selectedMembers.length} selected)
                  </Label>
                  {membersLoading ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : approvedMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members available</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {approvedMembers.map((m) => (
                        <div key={m.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`member-${m.id}`}
                            checked={selectedMembers.includes(m.id)}
                            onCheckedChange={() => handleMemberToggle(m.id)}
                          />
                          <Label 
                            htmlFor={`member-${m.id}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {m.full_name}
                            {m.role === 'admin' && (
                              <span className="ml-2 text-xs text-primary">(Admin)</span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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