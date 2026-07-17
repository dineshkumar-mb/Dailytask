import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

export const DATABASE_NAME = 'dailytasks.db';

// Create a synchronous connection to the database
export const sqliteDb = openDatabaseSync(DATABASE_NAME);

// Wrap it with Drizzle ORM
export const db = drizzle(sqliteDb);
