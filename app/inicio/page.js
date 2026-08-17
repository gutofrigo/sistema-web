'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, Wallet, FolderKanban, Kanban, ShieldAlert, ArrowRight, Clock, LayoutDashboard } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

function formatarMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0)
}

const labelRag = { vermelho: 'Critico', ambar: 'Atencao', verde: 'No prazo', cinza: 'Sem dados' }

export default function Inicio() {
  const [dados, setDados] = useState(null)

  useEffect(() => {
    fetch('/api/pmo').then(r => r.json()).then(setDados)
  }, [])

  const cardStyle = { background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }
  const painelStyle = { background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '10px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', overflow: 'hidden' }

  if (!dados) {
    return (
      <AppShell title="Visao geral" subtitle="Sistema de Melhoria">
        <div className="page-pad" style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', boxSizing: 'border-box', textAlign: 'center', color: C.textoMudo, padding: '80px 0' }}>
          Carregando indicadores...
        </div>
      </AppShell>
    )
  }

  if (dados.erro) {
    return (
      <AppShell title="Visao geral" subtitle="Sistema de Melhoria">
        <div className="page-pad" style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', boxSizing: 'border-box', textAlign: 'center', color: C.vermelho, padding: '80px 0' }}>
          Erro ao carregar indicadores: {dados.erro}
        </div>
      </AppShell>
    )
  }

  const resumo = dados.resumo || {}
  const projetos = dados.projetos || []
  const tarefasProximas = dados.tarefasProximas || []
  const atencao = projetos.filter(p => p.rag.geral === 'vermelho' || p.rag.geral === 'ambar').slice(0, 6)

  const statCards = [
    { label: 'Projetos', valor: resumo.totalProjetos || 0, icone: FolderKanban, cor: C.texto },
    { label: 'Em atencao', valor: resumo.emAtencao || 0, icone: AlertTriangle, cor: C.ambar },
    { label: 'Orcamento total', valor: formatarMoeda(resumo.orcamentoTotal), icone: Wallet, cor: C.texto },
    { label: 'Realizado', valor: formatarMoeda(resumo.realizadoTotal), icone: Wallet, cor: C.statusInfo },
    { label: 'Riscos altos', valor: (resumo.riscosAbertos && resumo.riscosAbertos.alta) || 0, icone: ShieldAlert, cor: C.vermelho },
    { label: 'Iniciativas ativas', valor: dados.iniciativasTotal || 0, icone: Kanban, cor: C.roxo },
  ]

  return (
    <AppShell
      title="Visao geral"
      subtitle="Indicadores para decisao"
      actions={
        <a href="/pmo" className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.branco, border: `1px solid ${C.borda}`, color: C.texto, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          <LayoutDashboard size={14} /> Portfolio completo
        </a>
      }
    >
      <div className="page-pad" style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <div className="grid-6" style={{ marginBottom: '20px' }}>
          {statCards.map(c => {
            const Icone = c.icone
            return (
              <div key={c.label} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icone size={14} color={c.cor} />
                  <p style={{ margin: 0, fontSize: '11px', color: C.textoMudo, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{c.label}</p>
                </div>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: c.cor }}>{c.valor}</p>
              </div>
            )
          })}
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div style={painelStyle}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.borda}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color={C.ambar} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: C.texto }}>Acao necessaria</h3>
            </div>
            {atencao.length === 0 ? (
              <p style={{ padding: '24px 20px', color: C.textoMudo, fontSize: '13px', margin: 0 }}>Nenhum projeto em situacao critica no momento.</p>
            ) : (
              <div>
                {atencao.map(p => (
                  <a key={p.id} href="/projetos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '13px 20px', borderBottom: `1px solid ${C.fundo}`, textDecoration: 'none' }} className="btn-ghost-hover">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: C[p.rag.geral] || C.textoMudo, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titulo}</p>
                      </div>
                      {p.rag.motivos && p.rag.motivos[0] && (
                        <p style={{ margin: '3px 0 0 16px', fontSize: '11.5px', color: C.textoMudo }}>{p.rag.motivos[0]}</p>
                      )}
                    </div>
                    <ArrowRight size={14} color={C.textoMudo} style={{ flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div style={painelStyle}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.borda}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color={C.statusInfo} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: C.texto }}>Prazos proximos (7 dias)</h3>
            </div>
            {tarefasProximas.length === 0 ? (
              <p style={{ padding: '24px 20px', color: C.textoMudo, fontSize: '13px', margin: 0 }}>Nenhuma tarefa com prazo nos proximos 7 dias.</p>
            ) : (
              <div>
                {tarefasProximas.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '13px 20px', borderBottom: `1px solid ${C.fundo}` }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</p>
                      {t.responsavel && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: C.textoMudo }}>{t.responsavel}</p>}
                    </div>
                    <span style={{ fontSize: '12px', color: C.textoSec, whiteSpace: 'nowrap' }}>{new Date(t.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
