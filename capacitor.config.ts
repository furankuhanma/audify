import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cherifi.app',
  appName: 'CheriFi Music',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#040448", 
      androidSplashResourceName: "icon_foreground",
      androidScaleType: "CENTER"
    }
  }
};

export default config;