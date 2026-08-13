-- Migração PMO Dashboard
-- Rode este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query).
-- É seguro rodar mais de uma vez (idempotente).
--
-- As colunas de referência abaixo usam "uuid" pois projetos.id é uuid neste projeto.

-- A. Registro de riscos por projeto (editável, não é só sugestão da IA)
create table if not exists riscos_projeto (
  id            uuid primary key default gen_random_uuid(),
  projeto_id    uuid not null references projetos(id) on delete cascade,
  descricao     text not null,
  categoria     text,
  probabilidade text not null default 'media' check (probabilidade in ('baixa','media','alta')),
  impacto       text not null default 'medio' check (impacto in ('baixo','medio','alto')),
  status        text not null default 'aberto' check (status in ('aberto','mitigado','fechado')),
  mitigacao     text,
  responsavel   text,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_riscos_projeto_projeto_id on riscos_projeto(projeto_id);

-- B. Vínculo opcional entre um roadmap e um projeto
alter table roadmaps add column if not exists projeto_id uuid references projetos(id) on delete set null;
create index if not exists idx_roadmaps_projeto_id on roadmaps(projeto_id);

-- C. Orçamento, prazo previsto e prioridade do projeto
alter table projetos add column if not exists orcamento numeric;
alter table projetos add column if not exists data_prevista_fim date;
alter table projetos add column if not exists prioridade text default 'media';

-- D. Vínculo opcional entre lançamento financeiro e projeto
alter table lancamentos add column if not exists projeto_id uuid references projetos(id) on delete set null;
create index if not exists idx_lancamentos_projeto_id on lancamentos(projeto_id);

-- E. Data de conclusão da tarefa (para gráfico de tendência)
alter table tarefas add column if not exists concluido_em timestamptz;
