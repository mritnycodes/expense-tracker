'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { inp, btn, box } from '@/lib/ui';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    const { error } = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (signup) setMsg('Account created. Check your email if confirmation is required, then sign in.');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-5">
      <h1 className="mb-1 text-3xl font-bold text-amber-400">Expense Tracker</h1>
      <p className="mb-6 text-sm text-stone-400">Track normal, debit and credit card spending.</p>
      <form onSubmit={submit} className={`${box} space-y-3`}>
        <input className={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inp} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button className={`${btn} w-full`} disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button>
        {msg && <p className="text-xs text-amber-300">{msg}</p>}
        <button type="button" onClick={() => setSignup(!signup)} className="w-full text-xs text-stone-400 underline">
          {signup ? 'Have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}
