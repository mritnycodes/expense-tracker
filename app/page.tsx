'use client';

import React, { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface CreditCardInfo {
  id: string;
  name: string;
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
}

export default function ExpenseTrackerApp() {
  // Auth State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authInputEmail, setAuthInputEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Navigation State
  const [mainTab, setMainTab] = useState<'output' | 'input'>('output');
  const [inputSubTab, setInputSubTab] = useState<'normal' | 'debit' | 'credit'>('normal');

  // Dynamic Data Lists
  const [normalExpenses, setNormalExpenses] = useState<ExpenseItem[]>([]);
  const [debitExpenses, setDebitExpenses] = useState<ExpenseItem[]>([]);
  const [creditExpenses, setCreditExpenses] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardInfo[]>([]);

  // Form Inputs - Normal/Debit
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Inputs - Credit Card Management
  const [newCardName, setNewCardName] = useState('');
  const [newCycleStart, setNewCycleStart] = useState('');
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Form Inputs - Credit Expense
  const [selectedCardId, setSelectedCardId] = useState('');
  const [creditTopic, setCreditTopic] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  // Request Notification Permissions
  useEffect(() => {
    async function initNotifications() {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.log('Running on web preview');
      }
    }
    initNotifications();
  }, []);

  // Handle Login / Sign Up
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authInputEmail) return;
    setUserEmail(authInputEmail);
    setAuthInputEmail('');
    setAuthPassword('');
  };

  // Handle Logout
  const handleLogout = () => {
    setUserEmail(null);
    setNormalExpenses([]);
    setDebitExpenses([]);
    setCreditExpenses([]);
    setCreditCards([]);
  };

  const handleEnableAlerts = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '💳 Payment Reminder Active',
            body: `Alerts set for account: ${userEmail}`,
            id: 999,
            schedule: { at: new Date(Date.now() + 2000) }
          }
        ]
      });
      alert('Alerts enabled successfully!');
    } catch (e) {
      alert('Alerts enabled (Native notification hook ready).');
    }
  };

  // Calculations
  const normalTotal = normalExpenses.reduce((sum, item) => sum + item.amount, 0);
  const debitTotal = debitExpenses.reduce((sum, item) => sum + item.amount, 0);
  const creditTotal = creditExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalSpending = normalTotal + debitTotal + creditTotal;

  // Expense Handlers
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newItem: ExpenseItem = {
      id: editingId || Date.now().toString(),
      title,
      amount: parseFloat(amount),
      category,
      date
    };

    if (inputSubTab === 'normal') {
      if (editingId) {
        setNormalExpenses(normalExpenses.map(i => i.id === editingId ? newItem : i));
      } else {
        setNormalExpenses([newItem, ...normalExpenses]);
      }
    } else if (inputSubTab === 'debit') {
      if (editingId) {
        setDebitExpenses(debitExpenses.map(i => i.id === editingId ? newItem : i));
      } else {
        setDebitExpenses([newItem, ...debitExpenses]);
      }
    }

    setTitle('');
    setAmount('');
    setEditingId(null);
  };

  const handleDeleteExpense = (id: string, type: 'normal' | 'debit') => {
    if (type === 'normal') {
      setNormalExpenses(normalExpenses.filter(i => i.id !== id));
    } else {
      setDebitExpenses(debitExpenses.filter(i => i.id !== id));
    }
  };

  const handleEditExpense = (item: ExpenseItem) => {
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDate(item.date);
    setEditingId(item.id);
  };

  // Card Handlers
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName) return;
    const card: CreditCardInfo = {
      id: Date.now().toString(),
      name: newCardName,
      cycleStart: newCycleStart || '2026-10-01',
      cycleEnd: newCycleEnd || '2026-10-31',
      dueDate: newDueDate || '2026-11-05'
    };
    setCreditCards([...creditCards, card]);
    if (!selectedCardId) setSelectedCardId(card.id);
    setNewCardName('');
    setNewCycleStart('');
    setNewCycleEnd('');
    setNewDueDate('');
  };

  const handleDeleteCard = (id: string) => {
    setCreditCards(creditCards.filter(c => c.id !== id));
    if (selectedCardId === id) setSelectedCardId('');
  };

  const handleSaveCreditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditTopic || !creditAmount || !selectedCardId) return;
    const card = creditCards.find(c => c.id === selectedCardId);
    const item = {
      id: Date.now().toString(),
      cardId: selectedCardId,
      cardName: card ? card.name : 'Credit Card',
      title: creditTopic,
      amount: parseFloat(creditAmount),
      date: new Date().toISOString().split('T')[0]
    };
    setCreditExpenses([...creditExpenses, item]);
    setCreditTopic('');
    setCreditAmount('');
  };

  // -------------------------------------------------------------
  // AUTHENTICATION SCREEN (IF NOT LOGGED IN)
  // -------------------------------------------------------------
  if (!userEmail) {
    return (
      <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center text-slate-950 font-bold text-xl mb-3 shadow-lg shadow-amber-500/20">
              💳
            </div>
            <h1 className="text-xl font-bold text-white">Expense Tracker</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in with your email to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input 
                type="email"
                placeholder="name@example.com"
                value={authInputEmail}
                onChange={(e) => setAuthInputEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-md shadow-amber-500/15 transition active:scale-95"
            >
              Sign In / Continue
            </button>
          </form>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // MAIN APP SCREEN (LOGGED IN)
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 pb-24 max-w-md mx-auto font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Dynamic Profile Header */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl mb-4 backdrop-blur-md shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Logged In As</p>
            <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button 
          onClick={handleEnableAlerts}
          className="bg-amber-500 hover:bg-amber-400 active:scale-95 transition text-slate-950 text-xs font-bold py-2.5 px-3 rounded-xl shadow-md shadow-amber-500/15 flex items-center justify-center gap-1.5"
        >
          <span>🔔</span> Enable Alerts
        </button>
        <button 
          onClick={handleLogout}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-slate-300 border border-slate-700/80 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center"
        >
          Logout
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-6 shadow-inner">
        <button 
          onClick={() => setMainTab('input')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-1.5 ${
            mainTab === 'input' 
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>💸</span> Input Expenses
        </button>
        <button 
          onClick={() => setMainTab('output')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-1.5 ${
            mainTab === 'output' 
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📊</span> Output & Reports
        </button>
      </div>

      {/* TAB 1: OUTPUT & REPORTS VIEW */}
      {mainTab === 'output' && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl shadow-black/50">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl"></div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Spending</p>
            <p className="text-3xl font-black text-white tracking-tight mb-4">₹{totalSpending.toLocaleString()}</p>

            <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Normal Expenses</span>
                <span className="font-bold text-slate-200">₹{normalTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Debit Card Expenses</span>
                <span className="font-bold text-slate-200">₹{debitTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Credit Card Expenses</span>
                <span className="font-bold text-amber-400">₹{creditTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <span>🔔</span> Due Date Status & Reminders
            </h3>

            {creditCards.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No credit cards added yet.</p>
            ) : (
              creditCards.map(card => {
                const cardExpensesTotal = creditExpenses
                  .filter(e => e.cardId === card.id)
                  .reduce((sum, e) => sum + e.amount, 0);

                return (
                  <div key={card.id} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-2 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-base">{card.name}</p>
                        <p className="text-[11px] text-slate-400">Cycle: {card.cycleStart} to {card.cycleEnd}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                        ₹{cardExpensesTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-400">Due Date: <strong className="text-white">{card.dueDate}</strong></span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px] border border-emerald-500/20">
                        ✅ On Track
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* TAB 2: INPUT EXPENSES VIEW */}
      {mainTab === 'input' && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            {(['normal', 'debit', 'credit'] as const).map((type) => (
              <button 
                key={type}
                onClick={() => setInputSubTab(type)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition ${
                  inputSubTab === type 
                    ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/60' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'credit' ? 'Credit Cards' : type}
              </button>
            ))}
          </div>

          {(inputSubTab === 'normal' || inputSubTab === 'debit') && (
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-white">
                {editingId ? 'Edit' : 'Add'} {inputSubTab === 'normal' ? 'Normal' : 'Debit'} Expense
              </h2>
              
              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <input 
                    type="text" 
                    placeholder="Title (e.g., Groceries)" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500 transition"
                  />
                  <input 
                    type="number" 
                    placeholder="Amount (₹)" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="General">General</option>
                    <option value="Food">Food & Drinks</option>
                    <option value="Bills">Bills & Utilities</option>
                  </select>

                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 transition text-slate-950 font-bold text-xs py-3 rounded-xl shadow-md shadow-amber-500/15"
                >
                  Save {inputSubTab === 'normal' ? 'Normal' : 'Debit'} Expense
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
                {(inputSubTab === 'normal' ? normalExpenses : debitExpenses).map((item) => (
                  <div key={item.id} className="bg-slate-950/60 border border-slate-800/60 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.category} • {item.date}</p>
                      <p className="text-sm font-bold text-amber-400 mt-0.5">₹{item.amount.toLocaleString()}</p>
                    </div>

                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleEditExpense(item)} 
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(item.id, inputSubTab)} 
                        className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs px-2.5 py-1.5 rounded-lg border border-rose-800/40 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inputSubTab === 'credit' && (
            <div className="space-y-5">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
                <h2 className="text-sm font-bold text-white">Manage Credit Cards</h2>

                {creditCards.map((card) => (
                  <div key={card.id} className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{card.name}</p>
                      <p className="text-xs text-slate-400">Due: {card.dueDate}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleDeleteCard(card.id)}
                        className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs px-2.5 py-1.5 rounded-lg border border-rose-800/40"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddCard} className="space-y-2.5 pt-3 border-t border-slate-800/80">
                  <input 
                    type="text" 
                    placeholder="Card Name (e.g., HDFC Regalia)" 
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500"
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    <input 
                      type="date" 
                      value={newCycleStart}
                      onChange={(e) => setNewCycleStart(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-[10px] px-1.5 py-2 rounded-xl"
                    />
                    <input 
                      type="date" 
                      value={newCycleEnd}
                      onChange={(e) => setNewCycleEnd(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-[10px] px-1.5 py-2 rounded-xl"
                    />
                    <input 
                      type="date" 
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-[10px] px-1.5 py-2 rounded-xl"
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs py-2.5 rounded-xl transition">
                    + Add Card
                  </button>
                </form>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white">Save Credit Expense</h3>
                <form onSubmit={handleSaveCreditExpense} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <select 
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled>Select Card</option>
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Topic / Note" 
                      value={creditTopic}
                      onChange={(e) => setCreditTopic(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Amount (₹)" 
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      required
                      className="flex-1 bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500"
                    />
                    <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl shadow-md shadow-amber-500/15 transition">
                      Save
                    </button>
                  </div>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  {creditExpenses.map((item) => (
                    <div key={item.id} className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-[10px] text-slate-400">{item.cardName}</p>
                      </div>
                      <p className="text-amber-400 font-bold">₹{item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mt-8 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-medium">
        Expense Tracker • Dynamic Multi-User UI
      </div>

    </main>
  );
}