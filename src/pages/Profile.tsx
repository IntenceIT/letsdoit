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
  BellOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { 
  requestNotificationPermission, 
  disableNotifications,
  getNotificationPermission,
  isNotificationSupported
} from '@/integrations/firebase/messaging';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, member, isAdmin, signOut } = useAuth();
  const { pendingCount } = useMembers();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);

  // Check notification status on mount
  useEffect(() => {
    if (member) {
      const hasToken = !!member.fcm_token;
      const permission = getNotificationPermission();
      setNotificationsEnabled(hasToken && permission === 'granted');
    }
  }, [member]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!member) return;

    if (!isNotificationSupported()) {
      toast({
        title: 'Not Supported',
        description: 'Notifications are not supported in this browser',
        variant: 'destructive',
      });
      return;
    }

    setIsTogglingNotifications(true);

    try {
      if (enabled) {
        // Show browser permission dialog (same as first time)
        const success = await requestNotificationPermission(member.id);
        if (success) {
          setNotificationsEnabled(true);
          toast({
            title: '🔔 Notifications Enabled',
            description: 'You\'ll receive daily task reminders at 12 AM and 7 PM',
          });
        } else {
          // Permission was denied
          setNotificationsEnabled(false);
          toast({
            title: 'Permission Denied',
            description: 'Please allow notifications in your browser settings to enable reminders',
            variant: 'destructive',
          });
        }
      } else {
        // Disable notifications
        const success = await disableNotifications(member.id);
        if (success) {
          setNotificationsEnabled(false);
          toast({
            title: 'Notifications Disabled',
            description: 'You won\'t receive push notifications anymore',
          });
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingNotifications(false);
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

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                SETTINGS
              </h2>
              <div className="space-y-3">
                {/* Notifications Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5 text-primary" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      {notificationsEnabled 
                        ? 'Enabled - Daily reminders at 12 AM & 7 PM' 
                        : 'Disabled - Tap to enable task reminders'}
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                    disabled={isTogglingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Menu Items */}
        {menuItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.4 }}
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
