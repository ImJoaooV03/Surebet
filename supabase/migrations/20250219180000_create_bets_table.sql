-- Create Bets Table for Bankroll Management
create table if not exists public.bets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  event_date timestamp with time zone default now(),
  event_name text not null,
  market text not null,
  selection text,
  odds numeric not null,
  stake numeric not null,
  status text check (status in ('pending', 'won', 'lost', 'void', 'cashout')) default 'pending',
  return_value numeric default 0, -- Valor retornado (0 se lost, stake * odds se won)
  profit numeric generated always as (
    case 
      when status = 'won' then (return_value - stake)
      when status = 'lost' then -stake
      when status = 'void' then 0
      when status = 'cashout' then (return_value - stake)
      else 0
    end
  ) stored,
  notes text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.bets enable row level security;

-- Policies
create policy "Users can view their own bets"
  on public.bets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bets"
  on public.bets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bets"
  on public.bets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bets"
  on public.bets for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index bets_user_id_idx on public.bets(user_id);
create index bets_event_date_idx on public.bets(event_date);
