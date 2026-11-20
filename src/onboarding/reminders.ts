import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Reminder } from './profile';

const ID = 'igloo-daily-study';
export const supportsReminders = Platform.OS === 'ios' || Platform.OS === 'android';
const permitted = (settings: Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>) =>
  settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

export async function enableReminder(time: Pick<Reminder, 'hour' | 'minute'>): Promise<boolean> {
  if (!supportsReminders) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ID, {
      name: 'Study reminders', importance: Notifications.AndroidImportance.DEFAULT, sound: null, enableVibrate: false,
    });
  }
  let access = await Notifications.getPermissionsAsync();
  if (!permitted(access) && access.canAskAgain) {
    access = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
  }
  if (!permitted(access)) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'A cozy moment to focus', body: 'Your study buddy saved you a little spot in Igloo.', sound: false },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.hour, minute: time.minute,
      ...(Platform.OS === 'android' ? { channelId: ID } : {}) },
  });
  return true;
}
export async function disableReminder() {
  if (supportsReminders) await Notifications.cancelScheduledNotificationAsync(ID);
}
