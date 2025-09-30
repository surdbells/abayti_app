import type { CapacitorConfig } from '@capacitor/cli';
import {KeyboardResize} from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: 'ae.threebayti.app',
  appName: '3bayti',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.None, // This is the key setting
    },
  },
};

export default config;
