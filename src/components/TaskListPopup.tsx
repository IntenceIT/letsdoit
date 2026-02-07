import React from 'react';
import { Check, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TaskWithAssignment } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface TaskListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tasks: TaskWithAssignment[];
  type: 'done' | 'pending';
}

const TaskListPopup: React.FC<TaskListPopupProps> = ({
  isOpen,
  onClose,
  title,
  tasks,
  type,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'done' ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Clock className="w-5 h-5 text-warning" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-4">
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tasks to display
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    type === 'done'
                      ? "bg-success/5 border-success/20"
                      : "bg-warning/5 border-warning/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-2xs shrink-0",
                        type === 'done' ? "status-done" : "status-pending"
                      )}
                    >
                      {type === 'done' ? 'DONE' : 'PENDING'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskListPopup;
