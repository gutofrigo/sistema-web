-- Migracao: campos RICE (Reach, Impact, Confidence, Effort) em Iniciativas
-- Rode no SQL Editor do Supabase. Seguro rodar mais de uma vez (idempotente).
-- Todos os campos sao opcionais: iniciativas sem RICE preenchido continuam
-- usando a prioridade manual (1-10) como hoje.

alter table iniciativas add column if not exists rice_reach numeric;
alter table iniciativas add column if not exists rice_impact numeric;
alter table iniciativas add column if not exists rice_confidence numeric;
alter table iniciativas add column if not exists rice_effort numeric;
