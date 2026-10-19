import Dexie, { Table } from 'dexie';

export type ExpType = 'normal' | 'debit' | 'credit';
export interface Expense {
  id: string; user_id: string; type: ExpType; title: string; amount: number;
  category: string; date: string; card_id: string | null;
  synced: 0 | 1; deleted: 0 | 1; updated_at: string;
}
export interface Card {
  id: string; user_id: string; name: string;
  cycle_start: string; cycle_end: string; due_date: string;
  synced: 0 | 1; deleted: 0 | 1; updated_at: string;
}

class AppDB extends Dexie {
  expenses!: Table<Expense, string>;
  cards!: Table<Card, string>;
  constructor() {
    super('ClientExpenseTrackerV2'); // new name: avoids clashing with the old DB
    this.version(1).stores({
      expenses: 'id, user_id, type, date, card_id, synced',
      cards: 'id, user_id, synced',
    });
  }
}
export const db = new AppDB();

export const nowIso = () => new Date().toISOString();
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const daysUntil = (d: string) =>
  Math.round((new Date(d + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime()) / 864e5);
