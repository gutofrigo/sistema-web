-- Migração: cronograma editável dentro de Projetos
-- Rode DEPOIS de migration_pmo.sql, no SQL Editor do Supabase.
-- Seguro rodar mais de uma vez (idempotente).

alter table tarefas add column if not exists progresso integer default 0 check (progresso >= 0 and progresso <= 100);
