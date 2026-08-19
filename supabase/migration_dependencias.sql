-- Migracao: dependencias entre tarefas (Fim-Inicio) para calculo de caminho critico (CPM)
-- Rode DEPOIS de migration_cronograma.sql, no SQL Editor do Supabase.
-- Seguro rodar mais de uma vez (idempotente).

create table if not exists tarefa_dependencias (
  id             uuid primary key default gen_random_uuid(),
  tarefa_id      uuid not null references tarefas(id) on delete cascade,
  predecessor_id uuid not null references tarefas(id) on delete cascade,
  criado_em      timestamptz not null default now(),
  constraint tarefa_dependencias_nao_auto check (tarefa_id <> predecessor_id),
  constraint tarefa_dependencias_unica unique (tarefa_id, predecessor_id)
);
create index if not exists idx_tarefa_dependencias_tarefa_id on tarefa_dependencias(tarefa_id);
create index if not exists idx_tarefa_dependencias_predecessor_id on tarefa_dependencias(predecessor_id);

alter table tarefa_dependencias enable row level security;
