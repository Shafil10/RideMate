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
  plugins: {
    StatusBar: {
      // Default to dark icons on the light --background token; SplashScreen
      // swaps this to light icons on brand green for the cold-open moment.
      style: 'DARK',
      backgroundColor: '#F8FAFC',
    },
  },
};

export default config;
