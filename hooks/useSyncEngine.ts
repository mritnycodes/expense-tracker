'use client';
import { useEffect } from 'react';
import { Network } from '@capacitor/network';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const TABLES = ['expenses', 'cards'] as const;

async function push(uid: string) {
  for (const t of TABLES) {
    const table = (db as any)[t];
    const rows = await table.where('synced').equals(0).filter((r: any) => r.user_id === uid).toArray();
    if (!rows.length) continue;
    const payload = rows.map(({ synced, ...r }: any) => r);
    const { error } = await supabase.from(t).upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    const gone = rows.filter((r: any) => r.deleted).map((r: any) => r.id);
    const keep = rows.filter((r: any) => !r.deleted).map((r: any) => r.id);
    if (gone.length) await table.bulkDelete(gone);
    for (const id of keep) await table.update(id, { synced: 1 });
  }
}

async function pull(uid: string) {
  for (const t of TABLES) {
    const table = (db as any)[t];
    const { data, error } = await supabase.from(t).select('*').eq('user_id', uid);
    if (error) throw error;
    for (const r of data ?? []) {
      const local = await table.get(r.id);
      if (local && (local.synced === 0 || local.updated_at >= r.updated_at)) continue;
      if (r.deleted) { await table.delete(r.id); continue; }
      await table.put({ ...r, amount: r.amount != null ? Number(r.amount) : undefined, synced: 1 });
    }
  }
}

export function useSyncEngine(uid?: string) {
  useEffect(() => {
    if (!uid) return;
    let busy = false;
    const run = async () => {
      if (busy) return;
      busy = true;
      try { await push(uid); await pull(uid); } catch (e) { console.warn('sync failed', e); } finally { busy = false; }
    };
    run();
    const timer = setInterval(run, 30000);
    const sub = Network.addListener('networkStatusChange', (s) => s.connected && run());
    return () => { clearInterval(timer); sub.then((h) => h.remove()); };
  }, [uid]);
}
