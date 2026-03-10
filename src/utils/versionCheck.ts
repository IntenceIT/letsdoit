// Version check utility to ensure users get the latest app version

const CURRENT_VERSION = '10.0.0';
const VERSION_KEY = 'app_version';

export const checkAppVersion = (): boolean => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (!storedVersion || storedVersion !== CURRENT_VERSION) {
    // Clear all caches and storage for new version
    clearAppCache();
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    return true; // Version updated
  }
  
  return false; // Same version
};

export const clearAppCache = async (): Promise<void> => {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Clear some localStorage items (keep auth and important user data)
    const keysToKeep = [
      'firebase:authUser',
      'firebase:host',
      'notification_prompt_granted',
      VERSION_KEY
    ];
    
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('App cache cleared for version update');
  } catch (error) {
    console.error('Error clearing app cache:', error);
  }
};

export const getCurrentVersion = (): string => CURRENT_VERSION;