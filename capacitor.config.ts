import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ae.threebayti.app',
  appName: '3bayti',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#F2C3AB',
      backgroundImage: 'assets/images/splash.png',
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
