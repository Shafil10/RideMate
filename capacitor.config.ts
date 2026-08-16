import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ridemate.app',
  appName: 'RideMate',
  webDir: 'dist',
  server: {
    // Match the local dev API's plain-http scheme so the WebView doesn't block
    // requests to it as "mixed content" (https page calling an http resource).
    androidScheme: 'http',
  },
};

export default config;
