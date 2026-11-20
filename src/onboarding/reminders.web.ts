import type { Reminder } from './profile';
export const supportsReminders = false;
export async function enableReminder(_time: Pick<Reminder, 'hour' | 'minute'>): Promise<boolean> { return false; }
export async function disableReminder(): Promise<void> {}
