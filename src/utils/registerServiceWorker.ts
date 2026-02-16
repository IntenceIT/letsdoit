// Register Service Worker for PWA functionality

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Don't cache the service worker file itself
      });

      console.log('Service Worker registered successfully:', registration.scope);

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATED') {
          console.log('Service Worker updated to version:', event.data.version);
          // Show a subtle notification
          if (document.visibilityState === 'visible') {
            const updateBanner = document.createElement('div');
            updateBanner.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 9999;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              animation: slideIn 0.3s ease-out;
            `;
            updateBanner.textContent = '✓ App updated successfully!';
            document.body.appendChild(updateBanner);
            
            setTimeout(() => {
              updateBanner.style.animation = 'slideOut 0.3s ease-in';
              setTimeout(() => updateBanner.remove(), 300);
            }, 3000);
          }
        }
        
        if (event.data.type === 'SW_READY') {
          console.log('Service Worker ready, version:', event.data.version);
        }
      });

      // Check for updates periodically (every 5 minutes)
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available!');
              // Auto-update without prompting
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              // Reload after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          });
        }
      });

      // Check for updates when page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.log('Service Workers not supported in this browser');
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};
