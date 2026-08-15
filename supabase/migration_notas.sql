-- Migracao: Notas & Arquivos (area estilo Notion, simplificada)
-- Rode no SQL Editor do Supabase. Seguro rodar mais de uma vez (idempotente).
-- Ja inclui "disable row level security" para nao travar como aconteceu
-- com a tabela iniciativas (Supabase ativa RLS por padrao em tabelas novas).

create table if not exists notas (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  conteudo      text,
  projeto_id    uuid references projetos(id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_notas_projeto_id on notas(projeto_id);
alter table notas disable row level security;

create table if not exists notas_arquivos (
  id               uuid primary key default gen_random_uuid(),
  nota_id          uuid not null references notas(id) on delete cascade,
  nome             text not null,
  tipo             text,
  tamanho          integer,
  conteudo_base64  text not null,
  criado_em        timestamptz not null default now()
);
create index if not exists idx_notas_arquivos_nota_id on notas_arquivos(nota_id);
alter table notas_arquivos disable row level security;
