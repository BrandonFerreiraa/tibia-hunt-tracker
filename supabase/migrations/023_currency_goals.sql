-- Story 6.1: Schema — Taxas de Câmbio e Metas de Profit
--
-- 2 tabelas novas, sem alterar nenhuma tabela existente:
-- - exchange_rates: 1 linha por usuário, taxas de câmbio configuráveis (KK por TC, Reais por 250 TC)
-- - goals: metas de profit por usuário (por conta, somando todos os personagens — não por personagem)
--
-- Mesmo padrão de RLS já usado em `characters`/`sessions` (ver supabase/schema.sql):
-- coluna user_id + policy "for all using/with check (user_id = auth.uid())".

create table if not exists exchange_rates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kk_per_tc numeric not null check (kk_per_tc > 0),
  brl_per_250tc numeric not null check (brl_per_250tc > 0),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_gold bigint not null check (target_gold > 0),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  final_profit_gold bigint,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Garante em nível de banco que nunca existem 2 metas 'active' pro mesmo usuário,
-- mesmo se a aplicação falhar em fechar a anterior antes de inserir a nova.
create unique index if not exists one_active_goal_per_user
  on goals(user_id) where (status = 'active');

create index if not exists idx_goals_user_id on goals(user_id);

alter table exchange_rates enable row level security;
alter table goals enable row level security;

create policy "Users manage own exchange_rates"
  on exchange_rates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage own goals"
  on goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
