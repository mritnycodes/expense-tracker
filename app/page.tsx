'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalExpense } from '@/lib/db';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { requestNotificationPermissions, scheduleCreditCardReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

// Define Card interface
interface CardItem {
  id: string;
  name: string;
  type: 'credit' | 'debit';
  due_day?: number;
}

export default function ExpenseTrackerHome() {
  useSyncEngine();

  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray()) || [];

  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [expenseType, setExpenseType] = useState<'normal' | 'debit' | 'credit'>('normal');

  // Cards State
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardType, setNewCardType] = useState<'credit' | 'debit'>('credit');
  const [newCardDueDay, setNewCardDueDay] = useState('');

  // Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Fetch cards from Supabase on mount
  useEffect(() => {
    async function fetchCards() {
      const { data } = await supabase.from('cards').select('*');
      if (data) setCards(data);
    }
    fetchCards();
  }, []);

  const handleAddCard = async () => {
    if (!newCardName) return;
    const { data, error } = await supabase.from('cards').insert([
      {
        name: newCardName,
        type: newCardType,
        due_day: newCardDueDay ? parseInt(newCardDueDay) : null,
      }
    ]).select();

    if (!error && data) {
      setCards(prev => [...prev, data[0]]);
      setNewCardName('');
      setNewCardDueDay('');
      alert('Card added successfully!');
    } else {
      alert('Error adding card: ' + error?.message);
    }
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const normalSpent = expenses.filter(e => e.category !== 'Debit' && e.category !== 'Credit').reduce((acc, curr) => acc + curr.amount, 0);
  const debitSpent = expenses.filter(e => e.category === 'Debit').reduce((acc, curr) => acc + curr.amount, 0);
  const creditSpent = expenses.filter(e => e.category === 'Credit').reduce((acc, curr) => acc + curr.amount, 0);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleEnableAlerts = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      alert('Notification permissions granted successfully!');
    } else {
      alert('Notification permissions were denied.');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const parsedAmount = parseFloat(amount);
    const categoryToUse = expenseType === 'credit' ? 'Credit' : expenseType === 'debit' ? 'Debit' : category;

    const newExpense: LocalExpense = {
      id: crypto.randomUUID(),
      title,
      amount: parsedAmount,
      category: categoryToUse,
      date,
      user_id: 'mrithinee@gmail.com',
      synced: false,
    };

    await db.expenses.add(newExpense);

    if (expenseType === 'credit' && dueDate) {
      await scheduleCreditCardReminder(title, parsedAmount, dueDate);
    }

    setTitle('');
    setAmount('');
    setDueDate('');
    setSelectedCardId('');
    alert('Expense recorded successfully!');
  };

  const isDark = theme === 'dark';

  return (
    <main className={`min-h-screen p-4 sm:p-6 max-w-md mx-auto font-sans pb-12 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top User Session & Theme Toggle Banner */}
      <div className={`border p-4 rounded-2xl shadow-sm flex items-center justify-between mb-4 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 text-white font-bold rounded-full flex items-center justify-center text-sm shadow">
            M
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Logged in as</p>
            <p className="text-xs font-bold">mrithinee@gmail.com</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Light/Dark Mode"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button
            onClick={() => {
              supabase.auth.signOut();
              localStorage.clear();
              window.location.href = '/login';
            }}
            className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors border ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Action Utility Bar */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleEnableAlerts}
          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
        >
          🔔 Enable Alerts
        </button>
        <div className={`border rounded-xl p-1 shadow-sm flex transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'input' 
                ? 'bg-indigo-600 text-white shadow' 
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Input
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'output' 
                ? 'bg-indigo-600 text-white shadow' 
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* TAB CONTENT: INPUT EXPENSES */}
      {activeTab === 'input' && (
        <div className="space-y-4">
          {/* Expense Type Switcher */}
          <div className={`border p-1.5 rounded-2xl shadow-sm grid grid-cols-3 gap-2 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {(['normal', 'debit', 'credit'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setExpenseType(type)}
                className={`py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                  expenseType === type 
                    ? 'bg-indigo-600 text-white shadow' 
                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type === 'credit' ? 'Credit Cards' : type}
              </button>
            ))}
          </div>

          {/* Card Management Section (Appears when Credit or Debit is selected) */}
          {(expenseType === 'credit' || expenseType === 'debit') && (
            <div className={`border p-4 rounded-2xl shadow-sm space-y-3 transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Manage & Add {expenseType.toUpperCase()} Cards</h3>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Card Name (e.g. HDFC Regalia)"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                
                {expenseType === 'credit' && (
                  <input
                    type="number"
                    placeholder="Statement Due Day (1 - 31)"
                    min="1"
                    max="31"
                    value={newCardDueDay}
                    onChange={(e) => setNewCardDueDay(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                )}

                <button
                  type="button"
                  onClick={handleAddCard}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold py-2 rounded-xl text-xs transition border border-slate-700"
                >
                  + Save New Card
                </button>
              </div>

              {/* Saved Cards Selector Dropdown */}
              {cards.filter(c => c.type === expenseType).length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold mb-1 opacity-80">Select From Saved Cards</label>
                  <select
                    value={selectedCardId}
                    onChange={(e) => {
                      setSelectedCardId(e.target.value);
                      const found = cards.find(c => c.id === e.target.value);
                      if (found) setTitle(found.name);
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="">-- Choose saved card --</option>
                    {cards.filter(c => c.type === expenseType).map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name} {card.due_day ? `(Due: ${card.due_day})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Form Card */}
          <div className={`border p-5 rounded-2xl shadow-sm space-y-4 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-sm font-bold">
              {expenseType === 'credit' ? 'Add Credit Card Bill & Due Date' : `Add ${expenseType.toUpperCase()} Expense`}
            </h2>

            <form onSubmit={handleAddExpense} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Title / Card Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={expenseType === 'credit' ? "e.g. HDFC Regalia" : "e.g. Groceries"}
                  className={`w-full border rounded-xl p-3 text-sm outline-none transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full border rounded-xl p-3 text-sm outline-none transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Transaction Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Conditional Credit Card Due Date Field */}
              {expenseType === 'credit' && (
                <div className={`border p-3.5 rounded-xl space-y-2 transition-colors ${
                  isDark ? 'bg-indigo-950/40 border-indigo-900/50 text-indigo-200' : 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
                }`}>
                  <label className="block text-xs font-bold">Credit Card Due Date (For Notifications)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                      isDark ? 'bg-slate-900 border-indigo-900 text-white' : 'bg-white border-indigo-200 text-slate-900'
                    }`}
                    required={expenseType === 'credit'}
                  />
                  <p className="text-[11px] opacity-80">A local notification reminder will be scheduled on this due date.</p>
                </div>
              )}

              {expenseType === 'normal' && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl p-3 text-sm outline-none transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="General">General</option>
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Bills">Bills</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-md shadow-indigo-600/20 mt-2"
              >
                Save {expenseType.toUpperCase()} Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OUTPUT & REPORTS */}
      {activeTab === 'output' && (
        <div className="space-y-4">
          <div className={`border p-5 rounded-2xl shadow-sm space-y-4 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-xs font-bold opacity-60 uppercase tracking-wider">Total Spending</h2>
            <p className="text-2xl font-extrabold">₹{totalSpent.toFixed(2)}</p>

            <div className={`border-t pt-3 space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex justify-between text-xs font-medium opacity-80">
                <span>Normal Expenses</span>
                <span className="font-bold">₹{normalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium opacity-80">
                <span>Debit Card Expenses</span>
                <span className="font-bold">₹{debitSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium opacity-80">
                <span>Credit Card Expenses</span>
                <span className="font-bold">₹{creditSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Due Date Status & Reminders Section */}
          <div className={`border p-5 rounded-2xl shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-xs font-bold flex items-center gap-1.5">
              <span>🔔</span> Due Date Status & Reminders
            </h3>
            {expenses.filter(e => e.category === 'Credit').length === 0 ? (
              <p className="text-xs opacity-50 text-center py-4">No credit cards added yet.</p>
            ) : (
              <div className="space-y-2">
                {expenses.filter(e => e.category === 'Credit').map((card) => (
                  <div key={card.id} className={`border p-3 rounded-xl flex justify-between items-center transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <p className="text-xs font-bold">{card.title}</p>
                      <p className="text-[10px] opacity-60">Billed: ₹{card.amount}</p>
                    </div>
                    <span className={`text-[10px] border px-2 py-1 rounded-lg font-semibold ${
                      isDark ? 'bg-indigo-950/60 text-indigo-300 border-indigo-900' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      Active Alert
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center mt-6">
        <p className="text-[11px] opacity-40 font-medium">Expense Tracker • Dynamic Theme UI</p>
      </div>
    </main>
  );
}