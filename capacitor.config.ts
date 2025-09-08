import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ae.threebayti.app',
  appName: '3bayti',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F2C3AB',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;
