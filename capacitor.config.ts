import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.nightcast.app',
  appName: 'NightCast',
  webDir: 'www',
  server: {
    // Single source of truth for the Android WebView entry point.
    url: 'https://nightcast.ir',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['www.nightcast.ir', 'nightcast.ir']
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#050a16'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#050a16',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050a16'
    }
  }
};

export default config;
