import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.intenceit.letsdoit',
  appName: 'Lets Do It',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  server: {
    // Use the live Vercel URL so the app always has latest data
    // Comment this out if you want fully offline/bundled mode
    // url: 'https://your-vercel-url.vercel.app',
    cleartext: false,
  },
};

export default config;
