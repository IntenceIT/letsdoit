import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './config';
import { membersService } from './firestore';

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Your Firebase Cloud Messaging VAPID key (you'll get this from Firebase Console)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (memberId: string): Promise<boolean> => {
  try {
    if (!isNotificationSupported()) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (token) {
        console.log('FCM Token:', token);
        
        // Save token to user's member document
        await membersService.update(memberId, {
          fcm_token: token
        });
        
        return true;
      }
    } else {
      console.log('Notification permission denied');
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return false;
  }
};

/**
 * Disable notifications for a user
 */
export const disableNotifications = async (memberId: string): Promise<boolean> => {
  try {
    // Remove FCM token from user's member document
    await membersService.update(memberId, {
      fcm_token: null
    });
    
    console.log('Notifications disabled');
    return true;
  } catch (error) {
    console.error('Error disabling notifications:', error);
    return false;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

/**
 * Show notification
 */
export const showNotification = (title: string, body: string, data?: any) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data
    });
  }
};
