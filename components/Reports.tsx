'use client';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Card, inr, today, daysUntil } from '@/lib/db';
import { box, inp } from '@/lib/ui';

export default function Reports({ uid, cards }: { uid: string; cards: Card[] }) {
  const [month, setMonth] = useState(''); // '' = all time, else YYYY-MM
  const all = useLiveQuery(() => db.expenses.where('user_id').equals(uid).filter((e) => !e.deleted).toArray(), [uid]) || [];
  const rows = month ? all.filter((e) => e.date.startsWith(month)) : all;
  const sum = (t: string) => rows.filter((e) => e.type === t).reduce((a, e) => a + e.amount, 0);
  const total = rows.reduce((a, e) => a + e.amount, 0);

  const byCat: Record<string, number> = {};
  rows.filter((e) => e.type !== 'credit').forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + e.amount));
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] || 1;

  const cycleSpend = (c: Card) =>
    all.filter((e) => e.card_id === c.id && e.date >= c.cycle_start && e.date <= c.cycle_end).reduce((a, e) => a + e.amount, 0);
  const status = (c: Card) => {
    const d = daysUntil(c.due_date);
    if (d < 0) return { t: `⚠️ Overdue by ${-d} day${d === -1 ? '' : 's'}`, cls: 'text-red-400' };
    if (d === 0) return { t: '🔔 Due today', cls: 'text-red-400' };
    if (d <= 3) return { t: `⏳ Due in ${d} day${d === 1 ? '' : 's'}`, cls: 'text-amber-400' };
    return { t: '✅ On Track', cls: 'text-emerald-400' };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <input className={inp} type="month" value={month} onChange={(e) => setMonth(e.target.value)} max={today().slice(0, 7)} />
        {month && <button className="text-xs text-amber-400 underline" onClick={() => setMonth('')}>All time</button>}
      </div>

      <section className={`${box} border-amber-500/30 bg-amber-500/10`}>
        <p className="text-sm text-stone-300">Total Spending {month ? `(${month})` : ''}</p>
        <p className="mt-1 text-3xl font-bold text-amber-300">{inr(total)}</p>
        <div className="mt-4 space-y-1.5 text-sm">
          {[['Normal Expenses', 'normal'], ['Debit Card Expenses', 'debit'], ['Credit Card Expenses', 'credit']].map(([l, t]) => (
            <div key={t} className="flex justify-between"><span className="text-stone-300">{l}</span><span className="font-semibold text-stone-100">{inr(sum(t))}</span></div>
          ))}
        </div>
      </section>

      {cats.length > 0 && (
        <section className={box}>
          <h3 className="mb-3 font-semibold text-amber-100">Spending by Category</h3>
          <div className="space-y-2.5">
            {cats.map(([c, v]) => (
              <div key={c}>
                <div className="mb-1 flex justify-between text-xs text-stone-300"><span>{c}</span><span>{inr(v)}</span></div>
                <div className="h-2 rounded-full bg-stone-800"><div className="h-2 rounded-full bg-amber-500" style={{ width: `${(v / maxCat) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-amber-100">🔔 Due Date Status & Reminders</h3>
        {cards.length === 0 && <p className="text-sm text-stone-500">Add a credit card under Input Expenses → Credit Cards.</p>}
        {cards.map((c) => {
          const s = status(c);
          return (
            <div key={c.id} className={box}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-stone-100">💳 {c.name}</p>
                  <p className="text-xs text-stone-400">Cycle: {c.cycle_start} to {c.cycle_end}</p>
                </div>
                <p className="text-xl font-bold text-amber-300">{inr(cycleSpend(c))}</p>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-stone-300">Due Date: <b className="text-stone-100">{c.due_date}</b></span>
                <span className={`font-medium ${s.cls}`}>{s.t}</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
