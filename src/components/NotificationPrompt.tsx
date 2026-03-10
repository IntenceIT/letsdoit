import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  requestNotificationPermission, 
  getNotificationPermission,
  isNotificationSupported 
} from '@/integrations/firebase/messaging';

interface NotificationPromptProps {
  memberId: string;
  onClose: () => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ memberId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const shouldShow = () => {
      if (!isNotificationSupported()) return false;
      
      const permission = getNotificationPermission();
      if (permission !== 'default') return false; // Already granted or denied
      
      // Show for new users or if they haven't seen it in the last 7 days
      const lastPromptTime = localStorage.getItem('notification_prompt_last_shown');
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      if (!lastPromptTime || parseInt(lastPromptTime) < sevenDaysAgo) {
        return true;
      }
      
      return false;
    };

    if (shouldShow()) {
      // Show prompt after 3 seconds delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('notification_prompt_last_shown', Date.now().toString());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const success = await requestNotificationPermission(memberId);
      localStorage.setItem('notification_prompt_granted', 'true');
      
      if (success) {
        // Show success message briefly before closing
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, 1500);
      } else {
        // Permission denied
        setIsVisible(false);
        setTimeout(onClose, 300);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setIsVisible(false);
      setTimeout(onClose, 300);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          
          {/* Prompt Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <Card className="shadow-2xl border-2">
              <CardContent className="p-6 relative">
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
                  disabled={isRequesting}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-2">
                    Stay on Track! 🎯
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get daily reminders to complete your tasks:
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-lg">🌅</span>
                      <span className="text-muted-foreground">
                        <strong>12 AM:</strong> New day, fresh start
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-lg">⏰</span>
                      <span className="text-muted-foreground">
                        <strong>7 PM:</strong> Pending task reminders
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleEnable}
                    disabled={isRequesting}
                    className="w-full h-11"
                  >
                    {isRequesting ? (
                      <>
                        <span className="animate-pulse">Enabling...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Enable Notifications
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    disabled={isRequesting}
                    className="w-full"
                  >
                    Maybe Later
                  </Button>
                </div>

                {/* Note */}
                <p className="text-xs text-center text-muted-foreground mt-4">
                  You can change this anytime in your Profile
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
