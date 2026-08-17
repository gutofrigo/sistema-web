alter table projetos add column if not exists area text;
alter table projetos add column if not exists progresso integer default 0;
alter table projetos add column if not exists em_risco boolean default false;
