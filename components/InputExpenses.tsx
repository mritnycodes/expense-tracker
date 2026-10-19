'use client';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Card, ExpType, today, nowIso, inr } from '@/lib/db';
import { inp, btn, btn2, box, Tab, Label } from '@/lib/ui';

const CATS = ['General', 'Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];
const TITLES = { normal: 'Add Normal Expense', debit: 'Add Debit Card Expense', credit: 'Save Credit Expense' };

function ExpenseSection({ uid, type, cards }: { uid: string; type: ExpType; cards: Card[] }) {
  const blank = { title: '', amount: '', category: 'General', date: today(), card_id: '' };
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const rows = useLiveQuery(
    () => db.expenses.where('user_id').equals(uid).filter((e) => e.type === type && !e.deleted).toArray(),
    [uid, type]
  ) || [];
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.updated_at.localeCompare(a.updated_at));
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const cardName = (id: string | null) => cards.find((c) => c.id === id)?.name ?? 'Deleted card';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(f.amount);
    if (!f.title.trim() || !(amount > 0)) return alert('Enter a title and an amount above 0.');
    const card_id = type === 'credit' ? f.card_id || cards[0]?.id || null : null;
    if (type === 'credit' && !card_id) return alert('Add a credit card first.');
    const data = {
      title: f.title.trim(), amount, date: f.date,
      category: type === 'credit' ? 'Credit' : f.category, card_id,
    };
    if (editId) await db.expenses.update(editId, { ...data, synced: 0, updated_at: nowIso() });
    else await db.expenses.add({ id: crypto.randomUUID(), user_id: uid, type, ...data, synced: 0, deleted: 0, updated_at: nowIso() });
    setF({ ...blank, card_id: f.card_id });
    setEditId(null);
  };

  const edit = (x: (typeof rows)[number]) => {
    setF({ title: x.title, amount: String(x.amount), category: x.category, date: x.date, card_id: x.card_id ?? '' });
    setEditId(x.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const del = async (id: string) => {
    if (confirm('Delete this expense?')) await db.expenses.update(id, { deleted: 1, synced: 0, updated_at: nowIso() });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-amber-100">{editId ? 'Edit Expense' : TITLES[type]}</h2>
      <form onSubmit={save} className={`${box} space-y-3`}>
        {type === 'credit' && (
          <Label t="Credit card">
            <select className={inp} value={f.card_id || cards[0]?.id || ''} onChange={(e) => set('card_id', e.target.value)}>
              {cards.length === 0 && <option value="">No cards yet</option>}
              {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Label>
        )}
        <input className={inp} placeholder={type === 'credit' ? 'Topic / Note' : 'Title (e.g., Groceries)'} value={f.title} onChange={(e) => set('title', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} type="number" inputMode="decimal" step="0.01" placeholder="Amount (₹)" value={f.amount} onChange={(e) => set('amount', e.target.value)} />
          <input className={inp} type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        {type !== 'credit' && (
          <select className={inp} value={f.category} onChange={(e) => set('category', e.target.value)}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <button className={`${btn} flex-1`}>{editId ? 'Update' : TITLES[type]}</button>
          {editId && <button type="button" className={btn2} onClick={() => { setEditId(null); setF(blank); }}>Cancel</button>}
        </div>
      </form>

      <div className="space-y-2">
        {sorted.length === 0 && <p className="py-4 text-center text-sm text-stone-500">No entries yet.</p>}
        {sorted.map((x) => (
          <div key={x.id} className={`${box} flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-100">{x.title}</p>
              <p className="text-xs text-stone-400">
                {type === 'credit' ? cardName(x.card_id) : x.category} • {x.date}
                {x.synced ? '' : ' • ⏳ pending sync'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-semibold text-amber-300">{inr(x.amount)}</span>
              <button className={btn2} onClick={() => edit(x)} aria-label="Edit">✏️</button>
              <button className={btn2} onClick={() => del(x.id)} aria-label="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardManager({ uid, cards }: { uid: string; cards: Card[] }) {
  const blank = { name: '', cycle_start: '', cycle_end: '', due_date: '' };
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.cycle_start || !f.cycle_end || !f.due_date) return alert('Fill the card name and all three dates.');
    if (f.cycle_end < f.cycle_start) return alert('Cycle end must be after cycle start.');
    const data = { ...f, name: f.name.trim() };
    if (editId) await db.cards.update(editId, { ...data, synced: 0, updated_at: nowIso() });
    else await db.cards.add({ id: crypto.randomUUID(), user_id: uid, ...data, synced: 0, deleted: 0, updated_at: nowIso() });
    setF(blank); setEditId(null);
  };
  const del = async (c: Card) => {
    if (!confirm(`Delete "${c.name}" and all its expenses?`)) return;
    await db.transaction('rw', db.cards, db.expenses, async () => {
      await db.cards.update(c.id, { deleted: 1, synced: 0, updated_at: nowIso() });
      const ex = await db.expenses.where('user_id').equals(uid).filter((e) => e.card_id === c.id && !e.deleted).toArray();
      for (const e of ex) await db.expenses.update(e.id, { deleted: 1, synced: 0, updated_at: nowIso() });
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-amber-100">Manage Credit Cards</h2>
      {cards.length === 0 && <p className="text-sm text-stone-500">No cards yet. Add your first one below.</p>}
      {cards.map((c) => (
        <div key={c.id} className={`${box} flex items-center justify-between gap-3`}>
          <div>
            <p className="font-semibold text-stone-100">💳 {c.name}</p>
            <p className="text-xs text-stone-400">Cycle: {c.cycle_start} to {c.cycle_end}</p>
            <p className="text-xs text-amber-300">Due: {c.due_date}</p>
          </div>
          <div className="flex gap-2">
            <button className={btn2} aria-label="Edit" onClick={() => { setEditId(c.id); setF({ name: c.name, cycle_start: c.cycle_start, cycle_end: c.cycle_end, due_date: c.due_date }); }}>✏️</button>
            <button className={btn2} aria-label="Delete" onClick={() => del(c)}>🗑️</button>
          </div>
        </div>
      ))}
      <form onSubmit={save} className={`${box} space-y-3`}>
        <input className={inp} placeholder="New Card Name" value={f.name} onChange={(e) => set('name', e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Label t="Cycle start"><input className={inp} type="date" value={f.cycle_start} onChange={(e) => set('cycle_start', e.target.value)} /></Label>
          <Label t="Cycle end"><input className={inp} type="date" value={f.cycle_end} onChange={(e) => set('cycle_end', e.target.value)} /></Label>
          <Label t="Due date"><input className={inp} type="date" value={f.due_date} onChange={(e) => set('due_date', e.target.value)} /></Label>
        </div>
        <div className="flex gap-2">
          <button className={`${btn} flex-1`}>{editId ? 'Update Card' : '+ Add Card'}</button>
          {editId && <button type="button" className={btn2} onClick={() => { setEditId(null); setF(blank); }}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

export default function InputExpenses({ uid, cards }: { uid: string; cards: Card[] }) {
  const [tab, setTab] = useState<ExpType>('normal');
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Tab on={tab === 'normal'} onClick={() => setTab('normal')}>Normal</Tab>
        <Tab on={tab === 'debit'} onClick={() => setTab('debit')}>Debit</Tab>
        <Tab on={tab === 'credit'} onClick={() => setTab('credit')}>Credit Cards</Tab>
      </div>
      {tab === 'credit' ? (
        <>
          <CardManager uid={uid} cards={cards} />
          <ExpenseSection key="credit" uid={uid} type="credit" cards={cards} />
        </>
      ) : (
        <ExpenseSection key={tab} uid={uid} type={tab} cards={cards} />
      )}
    </div>
  );
}
