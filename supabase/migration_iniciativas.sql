-- Migracao: Kanban de Iniciativas (backlog de pequenas demandas)
-- Rode no SQL Editor do Supabase, depois das migracoes anteriores.
-- Seguro rodar mais de uma vez (idempotente).

create table if not exists iniciativas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  categoria   text not null default 'outros' check (categoria in ('ti','processos','rh','financeiro','outros')),
  prioridade  integer not null default 5 check (prioridade between 1 and 10),
  solicitante text,
  responsavel text,
  status      text not null default 'backlog' check (status in ('backlog','em_analise','em_andamento','concluido')),
  projeto_id  uuid references projetos(id) on delete set null,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_iniciativas_status on iniciativas(status);
