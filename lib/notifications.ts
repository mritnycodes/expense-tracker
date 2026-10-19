import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { Card } from './db';

const native = () => Capacitor.isNativePlatform();

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!native()) return false;
  const r = await LocalNotifications.requestPermissions();
  return r.display === 'granted';
}

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 100000;
};

// [days before due date, hour of day]  ->  3d before, 1d before, then 3x on the due date
const SLOTS: [number, number][] = [[-3, 9], [-1, 9], [0, 9], [0, 13], [0, 18]];

/** Cancels everything and re-schedules reminders for all live cards. Call whenever cards change. */
export async function syncCardReminders(cards: Card[]) {
  if (!native()) return;
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length)
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });

  const now = Date.now();
  const list: { id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle: boolean } }[] = [];
  for (const c of cards) {
    if (c.deleted) continue;
    const [y, m, d] = c.due_date.split('-').map(Number);
    SLOTS.forEach(([off, hr], i) => {
      const at = new Date(y, m - 1, d + off, hr, 0, 0);
      if (at.getTime() <= now) return;
      list.push({
        id: hash(c.id) * 10 + i,
        title: `💳 ${c.name} bill ${off === 0 ? 'due today' : `due in ${-off} day${off === -1 ? '' : 's'}`}`,
        body: `Due date: ${c.due_date}. Pay on time to avoid late charges.`,
        schedule: { at, allowWhileIdle: true },
      });
    });
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list });
}
