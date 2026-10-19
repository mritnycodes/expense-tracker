create table if not exists public.cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cycle_start date not null,
  cycle_end date not null,
  due_date date not null,
  deleted smallint not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('normal','debit','credit')),
  title text not null,
  amount numeric(12,2) not null,
  category text not null,
  date date not null,
  card_id uuid,
  deleted smallint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.cards enable row level security;
alter table public.expenses enable row level security;
create policy "own cards" on public.cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own expenses" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
