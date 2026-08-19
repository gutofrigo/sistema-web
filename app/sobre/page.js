'use client'
import { Compass, FolderKanban, Kanban, FileText, TrendingUp, Map, GanttChartSquare, Wallet, Sparkles, Workflow, Database, ShieldCheck, Palette, Server } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

const MODULOS = [
  {
    titulo: 'Início', rota: '/inicio', icone: Compass,
    proposito: 'Painel de decisão na entrada do sistema — sem cards de navegação, só indicadores.',
    itens: [
      'Cards de KPI: projetos, em atenção, orçamento total, realizado, riscos altos, iniciativas ativas',
      'Painel "Ação necessária" com projetos em situação crítica ou de atenção (RAG) e o motivo do alerta, linkando direto para o projeto',
      'Painel de prazos com vencimento nos próximos 7 dias',
    ],
  },
  {
    titulo: 'Projetos', rota: '/projetos', icone: FolderKanban,
    proposito: 'Núcleo do sistema: cadastro, cronograma e execução de projetos.',
    itens: [
      'Visão de portfólio agrupada por Área, com cards de indicadores e barra de avanço do portfólio',
      'EDT (Estrutura Analítica) hierárquica por projeto — numeração, status, atraso, responsável, datas e progresso',
      'Painel de edição em massa ("Editar tarefas") para atualizar % e datas de várias tarefas de uma vez, incluindo dependências entre tarefas',
      'Caminho crítico (CPM) calculado a partir das dependências e destacado no Gantt do projeto',
      'Registro de riscos por projeto, com severidade, mitigação e matriz visual de probabilidade x impacto',
      'Detecção de riscos por IA — analisa atrasos, tarefas sem responsável e orçamento para sugerir riscos ainda não registrados',
      'Importação de projetos por CSV, com atualização automática de projetos já existentes',
      'Geração de tarefas com IA a partir da descrição do projeto',
    ],
  },
  {
    titulo: 'Iniciativas', rota: '/iniciativas', icone: Kanban,
    proposito: 'Backlog de demandas e ideias fora da estrutura formal de projeto.',
    itens: [
      'Quadro Kanban (Backlog → Em análise → Em andamento → Concluído) com arrastar-e-soltar',
      'Categorias fixas (TI, Processos, RH, Financeiro, Outros) e prioridade numérica de 1 a 10',
      'Priorização por RICE (Reach, Impact, Confidence, Effort) opcional, com badge de score e ordenação automática no quadro',
      'Promoção de uma iniciativa para Projeto formal com um clique',
    ],
  },
  {
    titulo: 'Notas', rota: '/notas', icone: FileText,
    proposito: 'Área livre, estilo Notion, para conhecimento que não pertence a um projeto específico.',
    itens: [
      'Markdown simples: títulos, negrito, itálico, listas e checklist',
      'Anexos de arquivo de até 4MB e vínculo opcional a um projeto',
    ],
  },
  {
    titulo: 'PMO / Dashboard', rota: '/pmo', icone: TrendingUp,
    proposito: 'Análise aprofundada do portfólio, para quem já passou pela visão geral de Início.',
    itens: [
      'Status RAG (verde / âmbar / vermelho) por projeto, com o motivo de cada sinal',
      'Gráficos: projetos por status, riscos por severidade, orçado × realizado, tendência de conclusão de tarefas',
      'EVM (Earned Value Management): SPI, CPI e curva S (planejado x valor agregado x custo real) por projeto',
      'Carga de trabalho por responsável — tarefas abertas e atrasadas por pessoa, em todos os projetos',
      'Relatórios recentes de Análise de Processo e iniciativas por categoria',
    ],
  },
  {
    titulo: 'Roadmap', rota: '/roadmap', icone: Map,
    proposito: 'Geração de plano de projeto com IA, vinculável a um projeto existente.',
    itens: ['Roadmap gerado a partir de uma descrição, com etapas e riscos sugeridos'],
  },
  {
    titulo: 'Gantt', rota: '/gantt', icone: GanttChartSquare,
    proposito: 'Cronograma em formato de barras, reutilizável fora do contexto de um projeto específico.',
    itens: ['Visualização em calendário das tarefas com data definida'],
  },
  {
    titulo: 'Financeiro', rota: '/financeiro', icone: Wallet,
    proposito: 'Controle de lançamentos financeiros, usado como base do orçado × realizado no PMO.',
    itens: [
      'Lançamentos de entrada e saída, por categoria e por projeto',
      'Totais por categoria e saldo consolidado',
      'Previsão de caixa para os próximos 6 meses, com saldo projetado acumulado',
    ],
  },
  {
    titulo: 'Assistente IA', rota: '/assistente', icone: Sparkles,
    proposito: 'Duas frentes na mesma tela, alternadas por abas.',
    itens: [
      'Chat que responde sobre projetos, tarefas e prazos com base nos dados reais do sistema',
      '"Análise de Processo": entrevista guiada de 5 perguntas com IA atuando como consultor de PM/Produto sênior — crítico, baseado em PMBOK, ágil, Lean e Six Sigma',
      'Relatório gerado cria projetos automaticamente a partir das sugestões, com histórico de relatórios anteriores',
    ],
  },
  {
    titulo: 'Modelagem BPMN', rota: '/bpmn', icone: Workflow,
    proposito: 'Geração de diagrama de processo (BPMN) a partir de uma descrição em texto, com IA.',
    itens: ['Diagrama gerado automaticamente a partir da descrição do processo'],
  },
  {
    titulo: 'Dados', rota: '/dados', icone: Database,
    proposito: 'Hub central de upload e download — o mais recente dos módulos.',
    itens: [
      'Por entidade (Projetos, Iniciativas, Tarefas, Riscos): baixar modelo CSV, baixar dados atuais e importar CSV',
      'Importação faz upsert — atualiza o que já existe pelo título, cria o que é novo',
      'Tarefas e Riscos são resolvidos pelo título exato do projeto vinculado',
    ],
  },
]

const PLATAFORMA = [
  {
    titulo: 'Autenticação & segurança', icone: ShieldCheck,
    itens: [
      'Login simples por cookie, com middleware protegendo todas as páginas',
      'Todas as rotas /api/* exigem sessão válida — retornam 401 em vez de expor dados',
    ],
  },
  {
    titulo: 'Identidade visual', icone: Palette,
    itens: [
      'Paleta navy & bronze centralizada em um único arquivo de tema',
      'Barra lateral fixa escura, com item ativo destacado por barra de acento e sombra',
      'Fonte Figtree aplicada em todo o sistema; cards com sombra em camadas para dar profundidade',
    ],
  },
  {
    titulo: 'Dados & backend', icone: Server,
    itens: [
      'Banco de dados Postgres via Supabase, sem ORM',
      'Deploy contínuo na Vercel a cada alteração enviada ao repositório',
    ],
  },
]

const cardEstilo = { background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '10px', padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }
const secaoTituloEstilo = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textoMudo, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }
const linhaEstilo = { flex: 1, height: '1px', background: C.borda }

export default function Sobre() {
  return (
    <AppShell title="Sobre o sistema" subtitle="O que existe hoje">
      <div className="page-pad" style={{ maxWidth: '820px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <p style={{ color: C.textoSec, fontSize: '13.5px', lineHeight: '1.6', margin: '0 0 28px', maxWidth: '62ch' }}>
          Inventário dos módulos, funcionalidades e infraestrutura implementados até agora — da entrada em Início até o hub de dados.
        </p>

        <div style={{ display: 'flex', gap: '0', marginBottom: '32px', border: `1px solid ${C.borda}`, borderRadius: '10px', overflow: 'hidden', background: C.branco, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          {[{ n: '11', l: 'módulos ativos' }, { n: '17', l: 'rotas de API' }, { n: '100%', l: 'em produção' }].map((s, i) => (
            <div key={s.l} style={{ flex: 1, padding: '16px 18px', borderLeft: i > 0 ? `1px solid ${C.borda}` : 'none' }}>
              <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: C.texto, fontVariantNumeric: 'tabular-nums' }}>{s.n}</p>
              <p style={{ margin: 0, fontSize: '12px', color: C.textoMudo }}>{s.l}</p>
            </div>
          ))}
        </div>

        <p style={secaoTituloEstilo}>Navegação principal<span style={linhaEstilo} /></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
          {MODULOS.map(m => {
            const Icone = m.icone
            return (
              <div key={m.rota} style={cardEstilo}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.texto, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icone size={15} color={C.royal} /> {m.titulo}
                  </h3>
                  <span style={{ fontSize: '11.5px', color: C.royal, background: '#EEF2FF', padding: '3px 9px', borderRadius: '20px', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>{m.rota}</span>
                </div>
                <p style={{ margin: '6px 0 12px', fontSize: '13.5px', color: C.textoSec, lineHeight: '1.55' }}>{m.proposito}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {m.itens.map((item, i) => (
                    <li key={i} style={{ position: 'relative', paddingLeft: '16px', fontSize: '13.5px', lineHeight: '1.55', color: C.texto }}>
                      <span style={{ position: 'absolute', left: 0, top: '8px', width: '5px', height: '5px', borderRadius: '50%', background: C.acentoClaro }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p style={secaoTituloEstilo}>Plataforma & infraestrutura<span style={linhaEstilo} /></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
          {PLATAFORMA.map(p => {
            const Icone = p.icone
            return (
              <div key={p.titulo} style={cardEstilo}>
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: C.texto, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icone size={15} color={C.royal} /> {p.titulo}
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {p.itens.map((item, i) => (
                    <li key={i} style={{ position: 'relative', paddingLeft: '16px', fontSize: '13.5px', lineHeight: '1.55', color: C.texto }}>
                      <span style={{ position: 'absolute', left: 0, top: '8px', width: '5px', height: '5px', borderRadius: '50%', background: C.acentoClaro }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: C.textoMudo, borderTop: `1px solid ${C.borda}`, paddingTop: '18px', fontVariantNumeric: 'tabular-nums' }}>
          Next.js 16 · React 19 · Supabase
        </p>
      </div>
    </AppShell>
  )
}
