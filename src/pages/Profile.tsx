import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  LogOut, 
  Users, 
  Shield,
  ChevronRight,
  Loader2,
  Bell,
  Clock,
  Send,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  requestNotificationPermission,
  disableNotifications,
  getNotificationPermission,
  showNotification
} from '@/integrations/firebase/messaging';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, member, isAdmin, signOut } = useAuth();
  const { pendingCount } = useMembers();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isNotifEnabled, setIsNotifEnabled] = useState<boolean>(() => {
    return !!member?.fcm_token || getNotificationPermission() === 'granted';
  });
  const [isTogglingNotif, setIsTogglingNotif] = useState(false);

  // Admin: notification schedule state
  const [notifHour, setNotifHour] = useState(19);
  const [notifMinute, setNotifMinute] = useState(0);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ sent: number; total: number } | null>(null);

  // Load saved notification time on mount (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/notification-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setNotifHour(data.hour ?? 19);
          setNotifMinute(data.minute ?? 0);
        }
      })
      .catch(() => {/* use defaults */});
  }, [isAdmin]);

  const handleSaveNotifTime = async () => {
    setIsSavingTime(true);
    try {
      const res = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour: notifHour, minute: notifMinute }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: '✅ Schedule Saved',
          description: `Daily reminders will go out at ${String(notifHour).padStart(2, '0')}:${String(notifMinute).padStart(2, '0')} IST`,
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingTime(false);
    }
  };

  const handleSendTestNow = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_CRON_SECRET || ''}`,
        },
        body: JSON.stringify({ test: true }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ sent: data.summary?.sent ?? 0, total: data.summary?.total ?? 0 });
        toast({
          title: '🔔 Test Sent!',
          description: `Notifications sent to ${data.summary?.sent ?? 0} of ${data.summary?.total ?? 0} members who have pending tasks today.`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test');
      }
    } catch (err: any) {
      toast({ title: 'Test Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Format hour to 12h display
  const formatTime12h = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  React.useEffect(() => {
    if (member?.fcm_token) {
      setIsNotifEnabled(true);
    }
  }, [member?.fcm_token]);

  const handleToggleNotifications = async () => {
    if (!member?.id) return;
    setIsTogglingNotif(true);

    try {
      if (isNotifEnabled) {
        // Disable notifications
        const ok = await disableNotifications(member.id);
        if (ok) {
          setIsNotifEnabled(false);
          toast({
            title: 'Notifications Disabled',
            description: 'You will no longer receive daily reminder notifications',
          });
        }
      } else {
        // Enable notifications
        const ok = await requestNotificationPermission(member.id);
        if (ok) {
          setIsNotifEnabled(true);
          showNotification('🎉 Notifications Enabled!', 'You will now receive daily reminders to complete your tasks.');
          toast({
            title: 'Notifications Enabled',
            description: 'Notification permission granted & FCM token registered successfully!',
          });
        } else {
          toast({
            title: 'Permission Required',
            description: 'Notification permission was denied or restricted by your browser/device.',
            variant: 'destructive',
          });
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not update notification preferences.';
      toast({
        title: 'Notification Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsTogglingNotif(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    ...(isAdmin
      ? [
          {
            icon: Users,
            label: 'View Members',
            description: 'Manage team members',
            onClick: () => navigate('/members'),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-surface pb-20 safe-area-top">
      {/* Header with Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero text-white px-4 pt-8 pb-12 rounded-b-3xl"
      >
        <div className="max-w-lg mx-auto flex flex-col items-center">
          <Avatar className="w-24 h-24 border-4 border-white/30 shadow-xl">
            <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
              {user?.full_name ? getInitials(user.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mt-4">
            {user?.full_name || 'User'}
          </h1>
          <p className="text-white/80 text-sm">{user?.email}</p>
          {isAdmin && (
            <div className="flex items-center gap-1 mt-2 px-3 py-1 bg-white/20 rounded-full">
              <Shield className="w-3 h-3" />
              <span className="text-xs font-medium">Administrator</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 -mt-6 max-w-lg mx-auto space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                ACCOUNT INFO
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Display Name</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.full_name || 'Not set'}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Toggle Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                NOTIFICATIONS
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      {isNotifEnabled ? 'Notifications active' : 'Get daily task reminders'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isNotifEnabled ? "default" : "outline"}
                  size="sm"
                  disabled={isTogglingNotif}
                  onClick={handleToggleNotifications}
                  className="min-w-[80px]"
                >
                  {isTogglingNotif ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isNotifEnabled ? (
                    'Enabled'
                  ) : (
                    'Enable'
                  )}
                </Button>
              </div>

              {isNotifEnabled && (
                <div className="mt-4 pt-3 border-t flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      showNotification('🔔 Test Notification', 'Notifications are working perfectly on your device!');
                      toast({
                        title: 'Test Notification Sent',
                        description: 'Check your system/browser notification tray',
                      });
                    }}
                    className="text-xs text-primary hover:text-primary"
                  >
                    Send Test Notification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Notification Schedule Card — visible to admins only */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  REMINDER SCHEDULE
                </h2>

                {/* Time picker */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Daily Reminder Time</p>
                    <p className="text-xs text-muted-foreground">
                      Sends pending-task notification to all members (IST)
                    </p>
                  </div>
                </div>

                {/* Hour + Minute selectors */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Hour (0–23)</label>
                    <select
                      value={notifHour}
                      onChange={(e) => setNotifHour(Number(e.target.value))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')} — {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Minute</label>
                    <select
                      value={notifMinute}
                      onChange={(e) => setNotifMinute(Number(e.target.value))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-5">
                    <span className="text-sm font-semibold text-primary">
                      {formatTime12h(notifHour, notifMinute)}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full mb-3"
                  onClick={handleSaveNotifTime}
                  disabled={isSavingTime}
                >
                  {isSavingTime ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Clock className="w-4 h-4 mr-2" />Save Schedule</>
                  )}
                </Button>

                <Separator className="my-3" />

                {/* Test button */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Test: sends notification right now to all members with pending tasks today
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleSendTestNow}
                    disabled={isSendingTest}
                  >
                    {isSendingTest ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" />Send Test Reminder Now</>
                    )}
                  </Button>

                  {/* Result badge after test */}
                  {testResult && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <p className="text-xs text-green-700">
                        Sent to <strong>{testResult.sent}</strong> member{testResult.sent !== 1 ? 's' : ''} with pending tasks
                        {testResult.total > 0 && ` (${testResult.total} total members checked)`}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admin Menu Items */}
        {menuItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  ADMIN OPTIONS
                </h2>
                <div className="space-y-1">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors relative"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
                        <item.icon className="w-5 h-5 text-primary" />
                        {item.label === 'View Members' && pendingCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs font-bold rounded-full"
                          >
                            {pendingCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.label}</p>
                          {item.label === 'View Members' && pendingCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {pendingCount} pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="w-full h-12 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </motion.div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to sign in again to access your tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                'Logout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
