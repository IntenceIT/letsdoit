import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Edit2, Trash2, ChevronDown, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TaskWithAssignment } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, parseISO } from 'date-fns';

interface TaskCardProps {
  task: TaskWithAssignment;
  selectedDate: Date;
  onComplete: (taskId: string, isCompleted: boolean, aiCountValue?: string) => Promise<void>;
  onEdit?: (task: TaskWithAssignment) => void;
  onDelete?: (taskId: string) => void;
  isToday?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  selectedDate,
  onComplete,
  onEdit,
  onDelete,
  isToday = false,
}) => {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAiCountDialogOpen, setIsAiCountDialogOpen] = useState(false);
  const [aiCountValue, setAiCountValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check completion status from assignment
  const isCompleted = task.assignment?.completion_status === 'completed';
  const canEdit = isToday;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation();
    
    if (!canEdit || isProcessing) {
      console.log('Cannot edit:', { canEdit, isProcessing });
      return;
    }

    // If task requires AI count and we're marking it as done (going from pending to completed)
    if (!isCompleted && task.requires_ai_count) {
      setIsAiCountDialogOpen(true);
      return;
    }

    // Mark as processing to prevent double clicks
    setIsProcessing(true);
    
    try {
      console.log(`Toggling task ${task.id} from ${isCompleted} to ${!isCompleted}`);
      
      // CRITICAL FIX: Always pass the opposite of current state
      await onComplete(task.id, !isCompleted);
      
      console.log(`Successfully toggled task ${task.id} to ${!isCompleted ? 'completed' : 'pending'}`);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    } finally {
      // Add a small delay to prevent rapid re-clicks
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  const handleAiCountSubmit = async () => {
    if (!aiCountValue.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log(`Submitting AI count for task ${task.id}: ${aiCountValue}`);
      await onComplete(task.id, true, aiCountValue);
      setIsAiCountDialogOpen(false);
      setAiCountValue('');
    } catch (error) {
      console.error('Failed to submit AI count:', error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        layout
      >
        <Card
          className={cn(
            "overflow-hidden transition-all duration-200",
            isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700",
            isProcessing && "opacity-60 pointer-events-none"
          )}
        >
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Completion checkbox */}
                <button
                  onClick={handleToggleComplete}
                  disabled={!canEdit || isProcessing}
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    "transition-all duration-200 touch-button",
                    isCompleted
                      ? "bg-success border-success"
                      : "border-muted-foreground/30 hover:border-primary",
                    (!canEdit || isProcessing) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isCompleted && <Check className="w-4 h-4 text-success-foreground" />}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "font-semibold text-foreground",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {task.task_title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-2xs",
                            isCompleted ? "status-done" : "status-pending"
                          )}
                        >
                          {isCompleted ? 'DONE' : 'PENDING'}
                        </Badge>
                        {task.requires_ai_count && (
                          <Badge variant="secondary" className="text-2xs gap-1">
                            <Brain className="w-3 h-3" />
                            AI Count
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-2xs capitalize">
                          {task.task_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(task);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(task.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Completion info */}
                  {isCompleted && task.assignment && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Completed
                        {task.completedByUser && ` by ${task.completedByUser}`}
                        {task.assignment.completed_at && (() => {
                          try {
                            let completedDate: Date;
                            if (typeof task.assignment.completed_at === 'string') {
                              completedDate = parseISO(task.assignment.completed_at);
                            } else if (task.assignment.completed_at && typeof task.assignment.completed_at === 'object' && 'toDate' in task.assignment.completed_at) {
                              completedDate = (task.assignment.completed_at as any).toDate();
                            } else {
                              completedDate = task.assignment.completed_at as unknown as Date;
                            }
                            return ` at ${format(completedDate, 'h:mm a')}`;
                          } catch (e) {
                            return '';
                          }
                        })()}
                      </span>
                    </div>
                  )}

                  {/* AI Count value display */}
                  {isCompleted && task.requires_ai_count && task.assignment?.ai_count_value && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Brain className="w-3 h-3" />
                      <span>AI Count: {task.assignment.ai_count_value}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible details */}
              <CollapsibleContent className="mt-3">
                <div className="pl-9 space-y-2 text-sm">
                  {task.task_description && (
                    <div>
                      <span className="font-medium text-muted-foreground">Description:</span>
                      <p className="mt-1 text-foreground">{task.task_description}</p>
                    </div>
                  )}
                  {task.remarks && (
                    <div>
                      <span className="font-medium text-muted-foreground">Remarks:</span>
                      <p className="mt-1 text-foreground">{task.remarks}</p>
                    </div>
                  )}
                  {task.task_type === 'permanent' && task.weekdays.length > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground">Active Days:</span>
                      <p className="mt-1 text-foreground">{task.weekdays.join(', ')}</p>
                    </div>
                  )}
                  {task.task_type === 'additional' && (task.start_date || task.end_date) && (
                    <div>
                      <span className="font-medium text-muted-foreground">Date Range:</span>
                      <p className="mt-1 text-foreground">
                        {task.start_date && (() => {
                          try {
                            let startDate: Date;
                            if (typeof task.start_date === 'string') {
                              startDate = parseISO(task.start_date);
                            } else if (task.start_date && typeof task.start_date === 'object' && 'toDate' in task.start_date) {
                              startDate = (task.start_date as any).toDate();
                            } else {
                              startDate = task.start_date as Date;
                            }
                            return format(startDate, 'MMM d, yyyy');
                          } catch (e) {
                            return task.start_date.toString();
                          }
                        })()}
                        {task.start_date && task.end_date && ' - '}
                        {task.end_date && (() => {
                          try {
                            let endDate: Date;
                            if (typeof task.end_date === 'string') {
                              endDate = parseISO(task.end_date);
                            } else if (task.end_date && typeof task.end_date === 'object' && 'toDate' in task.end_date) {
                              endDate = (task.end_date as any).toDate();
                            } else {
                              endDate = task.end_date as Date;
                            }
                            return format(endDate, 'MMM d, yyyy');
                          } catch (e) {
                            return task.end_date.toString();
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </CardContent>
          </Collapsible>
        </Card>
      </motion.div>

      {/* AI Count Dialog */}
      <Dialog open={isAiCountDialogOpen} onOpenChange={setIsAiCountDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter AI Count Value</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              This task requires an AI count value to be marked as complete.
            </p>
            <Input
              placeholder="Enter AI count value..."
              value={aiCountValue}
              onChange={(e) => setAiCountValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && aiCountValue.trim()) {
                  handleAiCountSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAiCountDialogOpen(false);
                setAiCountValue('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAiCountSubmit}
              disabled={!aiCountValue.trim() || isProcessing}
            >
              {isProcessing ? 'Submitting...' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;