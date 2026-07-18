import { Alert, Platform } from 'react-native';
import { Logger } from '../services/Logger';

export class ErrorHandler {
  static handle(error: any, contextDescription?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    // Log the error centrally
    Logger.error(`Error encountered in [${contextDescription || 'General'}]: ${message}`, { stack });

    // Show friendly alert to the user
    const userFriendlyMsg = `Something went wrong. Please try again. If the issue persists, contact support.`;
    const title = 'Application Error';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(`${title}\n\n${userFriendlyMsg}\n\nDetails: ${message}`);
      }
    } else {
      Alert.alert(
        title,
        `${userFriendlyMsg}\n\nDetails: ${message}`,
        [{ text: 'Dismiss', style: 'cancel' }]
      );
    }
  }
}
