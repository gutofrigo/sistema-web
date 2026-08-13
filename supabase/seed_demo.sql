-- Dados de demonstracao para o PMO / Dashboard / Gantt / Financeiro
-- Rode DEPOIS de supabase/migration_pmo.sql, no SQL Editor do Supabase.
-- Cria 5 projetos com situacoes variadas (no prazo, atrasado, em atencao,
-- concluido, sem dados) para voce ver como cada status RAG fica visualmente.
-- Seguro rodar mais de uma vez? NAO — cada execucao cria projetos novos
-- (duplicados). Se quiser limpar, veja o comentario no final do arquivo.

DO $$
DECLARE
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; r1 uuid;
BEGIN

  -- 1) Projeto com tarefa atrasada + risco alto => RAG vermelho
  INSERT INTO projetos (titulo, descricao, responsavel, status, orcamento, data_prevista_fim, prioridade, criado_em)
  VALUES ('Migracao para nuvem AWS', 'Migrar toda a infraestrutura on-premise para AWS', 'Carlos Mendes', 'em_andamento', 180000, CURRENT_DATE + 15, 'alta', now() - interval '70 days')
  RETURNING id INTO p1;

  INSERT INTO tarefas (projeto_id, titulo, responsavel, status, data_entrega, concluido_em, criado_em) VALUES
  (p1, 'Levantamento de inventario de servidores', 'Ana Paula', 'concluido', CURRENT_DATE - 55, CURRENT_DATE - 52, now() - interval '68 days'),
  (p1, 'Setup de VPC e rede', 'Carlos Mendes', 'concluido', CURRENT_DATE - 35, CURRENT_DATE - 30, now() - interval '60 days'),
  (p1, 'Migracao do banco de dados de producao', 'Bruno Silva', 'em_andamento', CURRENT_DATE - 5, NULL, now() - interval '40 days'),
  (p1, 'Testes de carga', 'Ana Paula', 'pendente', CURRENT_DATE + 10, NULL, now() - interval '10 days');

  INSERT INTO riscos_projeto (projeto_id, descricao, categoria, probabilidade, impacto, status, mitigacao, responsavel) VALUES
  (p1, 'Indisponibilidade do sistema durante o corte de producao', 'Tecnico', 'media', 'alto', 'aberto', 'Migrar em janela de baixo trafego com plano de rollback pronto', 'Carlos Mendes');

  INSERT INTO lancamentos (descricao, valor, tipo, categoria, data_venc, recorrente, status, projeto_id) VALUES
  ('Licencas AWS - mes corrente', 45000, 'saida', 'outros', CURRENT_DATE - 20, false, 'pago', p1),
  ('Consultoria especializada de migracao', 78000, 'saida', 'outros', CURRENT_DATE - 10, false, 'pago', p1);

  -- 2) Projeto no prazo, orcamento sob controle, sem riscos => RAG verde
  INSERT INTO projetos (titulo, descricao, responsavel, status, orcamento, data_prevista_fim, prioridade, criado_em)
  VALUES ('Portal do Cliente 2.0', 'Redesenho do portal de autoatendimento', 'Fernanda Lima', 'em_andamento', 90000, CURRENT_DATE + 40, 'media', now() - interval '30 days')
  RETURNING id INTO p2;

  INSERT INTO tarefas (projeto_id, titulo, responsavel, status, data_entrega, concluido_em, criado_em) VALUES
  (p2, 'Pesquisa com usuarios', 'Fernanda Lima', 'concluido', CURRENT_DATE - 20, CURRENT_DATE - 19, now() - interval '28 days'),
  (p2, 'Prototipo de telas', 'Rafael Souza', 'concluido', CURRENT_DATE - 10, CURRENT_DATE - 9, now() - interval '20 days'),
  (p2, 'Desenvolvimento do front-end', 'Rafael Souza', 'em_andamento', CURRENT_DATE + 15, NULL, now() - interval '12 days');

  INSERT INTO lancamentos (descricao, valor, tipo, categoria, data_venc, recorrente, status, projeto_id) VALUES
  ('Design system e UI kit', 18000, 'saida', 'outros', CURRENT_DATE - 15, false, 'pago', p2);

  -- 3) Projeto novo, sem orcamento/prazo definidos ainda => RAG cinza
  INSERT INTO projetos (titulo, descricao, responsavel, status, prioridade, criado_em)
  VALUES ('Programa de Certificacao Interna', 'Trilha de certificacoes tecnicas para o time', 'Juliana Alves', 'pendente', 'baixa', now() - interval '3 days')
  RETURNING id INTO p3;

  INSERT INTO tarefas (projeto_id, titulo, responsavel, status, data_entrega, criado_em) VALUES
  (p3, 'Definir trilhas por area', 'Juliana Alves', 'pendente', CURRENT_DATE + 20, now() - interval '3 days');

  -- 4) Projeto levemente atrasado + 1 risco medio => RAG amarelo
  INSERT INTO projetos (titulo, descricao, responsavel, status, orcamento, data_prevista_fim, prioridade, criado_em)
  VALUES ('Redesenho do Onboarding', 'Novo fluxo de onboarding de clientes', 'Marcos Vinicius', 'em_andamento', 40000, CURRENT_DATE + 25, 'media', now() - interval '45 days')
  RETURNING id INTO p4;

  INSERT INTO tarefas (projeto_id, titulo, responsavel, status, data_entrega, concluido_em, criado_em) VALUES
  (p4, 'Mapeamento da jornada atual', 'Marcos Vinicius', 'concluido', CURRENT_DATE - 30, CURRENT_DATE - 28, now() - interval '44 days'),
  (p4, 'Definicao do novo fluxo', 'Marcos Vinicius', 'em_andamento', CURRENT_DATE - 2, NULL, now() - interval '30 days'),
  (p4, 'Ajustes no CRM', 'Patricia Nunes', 'pendente', CURRENT_DATE + 12, NULL, now() - interval '15 days');

  INSERT INTO riscos_projeto (projeto_id, descricao, categoria, probabilidade, impacto, status, mitigacao, responsavel) VALUES
  (p4, 'Dependencia de time terceirizado do CRM', 'Fornecedor', 'media', 'medio', 'aberto', 'Alinhar prazos com o fornecedor semanalmente', 'Marcos Vinicius');

  INSERT INTO lancamentos (descricao, valor, tipo, categoria, data_venc, recorrente, status, projeto_id) VALUES
  ('Ajustes de integracao CRM', 22000, 'saida', 'outros', CURRENT_DATE - 8, false, 'pago', p4);

  -- 5) Projeto concluido, dentro do orcamento => RAG verde
  INSERT INTO projetos (titulo, descricao, responsavel, status, orcamento, data_prevista_fim, prioridade, criado_em)
  VALUES ('Auditoria de Compliance LGPD', 'Auditoria completa de conformidade com a LGPD', 'Renata Costa', 'concluido', 25000, CURRENT_DATE - 5, 'alta', now() - interval '90 days')
  RETURNING id INTO p5;

  INSERT INTO tarefas (projeto_id, titulo, responsavel, status, data_entrega, concluido_em, criado_em) VALUES
  (p5, 'Mapeamento de dados pessoais', 'Renata Costa', 'concluido', CURRENT_DATE - 60, CURRENT_DATE - 58, now() - interval '88 days'),
  (p5, 'Relatorio final de auditoria', 'Renata Costa', 'concluido', CURRENT_DATE - 8, CURRENT_DATE - 9, now() - interval '20 days');

  INSERT INTO lancamentos (descricao, valor, tipo, categoria, data_venc, recorrente, status, projeto_id) VALUES
  ('Consultoria juridica especializada', 21000, 'saida', 'outros', CURRENT_DATE - 15, false, 'pago', p5);

  -- Roadmap de exemplo vinculado ao projeto 1, para testar "Importar sugestoes do roadmap"
  INSERT INTO roadmaps (titulo, descricao, responsavel, porte, area, resumo, oportunidades, fases, riscos, kpis, stakeholders, projeto_id)
  VALUES (
    'Roadmap - Migracao para nuvem AWS',
    'Plano de migracao de infraestrutura',
    'Carlos Mendes', 'grande', 'TI',
    'Migracao completa da infraestrutura on-premise para AWS em 4 fases.',
    '["Reducao de custo de infraestrutura", "Maior escalabilidade"]'::jsonb,
    '[{"numero":1,"nome":"Planejamento","duracao":"2 semanas","cor":"blue","objetivo":"Mapear inventario","acoes":["Levantar servidores","Definir arquitetura alvo"],"tecnologias":["AWS"],"resultado_esperado":"Plano de migracao aprovado"}]'::jsonb,
    '[{"descricao":"Perda de dados durante a migracao","probabilidade":"baixa","impacto":"alto","mitigacao":"Backup completo antes do corte"},{"descricao":"Estouro de custo com instancias subdimensionadas","probabilidade":"media","impacto":"medio","mitigacao":"Revisar dimensionamento com FinOps"}]'::jsonb,
    '["Reducao de 20% no custo de infraestrutura", "Zero incidentes criticos pos-migracao"]'::jsonb,
    '["TI", "Financeiro", "Seguranca da informacao"]'::jsonb,
    p1
  );

END $$;

-- Para apagar os dados de demonstracao depois, rode (ajuste os titulos se editar algo):
-- delete from projetos where titulo in (
--   'Migracao para nuvem AWS', 'Portal do Cliente 2.0', 'Programa de Certificacao Interna',
--   'Redesenho do Onboarding', 'Auditoria de Compliance LGPD'
-- );
-- (isso tambem apaga tarefas/riscos/lancamentos/roadmaps vinculados, via cascade/set null)
