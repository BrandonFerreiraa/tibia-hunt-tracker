-- Story 6.4: permite cancelar uma meta sem gerar resultado batida/não batida.
--
-- IMPORTANTE: confira o nome real do constraint antes de rodar em produção
-- (select conname from pg_constraint where conrelid = 'goals'::regclass and
-- contype = 'c'), caso o nome padrão do Postgres tenha mudado por algum motivo.
-- "goals_status_check" é o nome padrão que o Postgres dá a um `check` inline
-- sem nome explícito na coluna `status` da tabela `goals` (Story 6.1).

alter table goals drop constraint if exists goals_status_check;
alter table goals add constraint goals_status_check
  check (status in ('active', 'completed', 'failed', 'cancelled'));
