import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import type * as NotificationsType from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let Notifications: typeof NotificationsType | null = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Ignored, handled below
}

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<NotificationsType.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<NotificationsType.Notification | undefined>();

  const notificationListener = useRef<NotificationsType.Subscription | null>(null);
  const responseListener = useRef<NotificationsType.Subscription | null>(null);

  async function registerForPushNotificationsAsync() {
    if (!Notifications) return undefined;
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      try {
        // Note: if you have an EAS project ID, you would pass it here
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants?.expoConfig?.extra?.eas?.projectId,
        });
      } catch (e) {
        console.log('Failed to fetch Expo Push Token (Expected in Expo Go without EAS):', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    if (!Notifications) return;

    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
