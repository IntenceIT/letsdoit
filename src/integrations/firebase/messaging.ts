// Firebase messaging utilities with conditional loading
let messaging: any = null;
let getToken: any = null;
let onMessage: any = null;

// Dynamically import Firebase messaging only when needed
const initializeMessaging = async () => {
  if (messaging) return messaging;
  
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const { getMessaging, getToken: _getToken, onMessage: _onMessage } = await import('firebase/messaging');
      const { app } = await import('./config');
      
      messaging = getMessaging(app);
      getToken = _getToken;
      onMessage = _onMessage;
      
      return messaging;
    }
  } catch (error) {
    console.warn('Firebase messaging not available:', error);
  }
  
  return null;
};

// Your Firebase Cloud Messaging VAPID key (you'll get this from Firebase Console)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
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

    // Initialize messaging
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance || !getToken) {
      console.warn('Firebase messaging not available');
      return false;
    }

    // Check if VAPID key is configured
    if (!VAPID_KEY) {
      console.error('VAPID key not configured in environment variables');
      throw new Error('VAPID key not configured. Please add VITE_FIREBASE_VAPID_KEY to your .env file.');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      let token: string | null = null;
      try {
        if (VAPID_KEY) {
          token = await getToken(messagingInstance, {
            vapidKey: VAPID_KEY
          });
        }
      } catch (tokenError: unknown) {
        console.warn('FCM getToken failed (VAPID key mismatch or push service error), falling back to browser Notification API:', tokenError?.message);
      }
      
      // Save token if obtained, or fallback to local notification granted flag
      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        const { membersService } = await import('./firestore');
        await membersService.update(memberId, {
          fcm_token: token
        });
      } else {
        console.log('FCM Push token unavailable, but browser notification permission granted.');
      }
      
      return true;
    } else {
      console.log('Notification permission denied or dismissed');
      return false;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    throw error;
  }
};

/**
 * Disable notifications for a user
 */
export const disableNotifications = async (memberId: string): Promise<boolean> => {
  try {
    // Dynamically import membersService to avoid circular dependencies
    const { membersService } = await import('./firestore');
    
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
export const onForegroundMessage = async (callback: (payload: any) => void) => {
  try {
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance || !onMessage) {
      console.warn('Messaging not available');
      return () => {};
    }
    
    return onMessage(messagingInstance, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.warn('Error setting up foreground message listener:', error);
    return () => {};
  }
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
