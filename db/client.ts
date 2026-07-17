import { Platform } from 'react-native';

export const DATABASE_NAME = 'dailytasks.db';

export let sqliteDb: any = null;
export let db: any = null;

if (Platform.OS !== 'web') {
  const { openDatabaseSync } = require('expo-sqlite');
  const { drizzle } = require('drizzle-orm/expo-sqlite');
  
  sqliteDb = openDatabaseSync(DATABASE_NAME);
  db = drizzle(sqliteDb);
}
