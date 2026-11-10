export interface Card {
  id: string;
  name: string;
  type: 'credit' | 'debit';
  due_day?: number;
}

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  card_id?: string;
}