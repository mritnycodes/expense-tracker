import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expensetracker.app',
  appName: 'Expense Tracker',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;