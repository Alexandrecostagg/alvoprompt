import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alvoprompt.app',
  appName: 'Alvoprompt',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0B0D12',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
    },
  },
};

export default config;
