import React from 'react';
export const inp = 'w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none';
export const btn = 'rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 active:scale-95 transition';
export const btn2 = 'rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200 active:scale-95 transition';
export const box = 'rounded-2xl border border-stone-800 bg-stone-900/70 p-4';
export const Tab = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${on ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-300 border border-stone-800'}`}>
    {children}
  </button>
);
export const Label = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <label className="block"><span className="mb-1 block text-xs text-stone-400">{t}</span>{children}</label>
);
