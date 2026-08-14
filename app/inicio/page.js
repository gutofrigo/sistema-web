'use client'
import { useState } from 'react'
import { ClipboardList, FolderKanban, TrendingUp, Map, Sparkles, Workflow, Wallet, History, ArrowLeft, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C, botaoVoltar, botaoPrimario } from '../theme'

const perguntas = [
  'Descreva como o processo funciona atualmente, do inicio ao fim.',
  'Quais sao os principais problemas ou gargalos que voce enfrenta nesse processo?',
  'Quanto tempo em media esse processo leva? Onde ocorrem os maiores atrasos?',
  'Quais ferramentas ou sistemas sao usados? Eles atendem bem?',
  'Se voce pudesse mudar uma coisa nesse processo, o que seria?'
]

export default function Inicio() {
  const [tela, setTela] = useState('inicio')
  const [processo, setProcesso] = useState('')
  const [nome, setNome] = useState('')
  const [etapa, setEtapa] = useState(0)
  const [respostas, setRespostas] = useState([])
  const [resposta, setResposta] = useState('')
  const [relatorio, setRelatorio] = useState('')
  const [projetosCriados, setProjetosCriados] = useState(0)
  const [entrevistas, setEntrevistas] = useState([])
  const [entrevistaAberta, setEntrevistaAberta] = useState(null)

  function iniciarEntrevista() {
    if (!processo || !nome) return alert('Preencha todos os campos')
    setTela('entrevista')
    setEtapa(0)
    setRespostas([])
  }

  async function responder() {
    if (!resposta.trim()) return
    const novas = [...respostas, { pergunta: perguntas[etapa], resposta: resposta }]
    setRespostas(novas)
    setResposta('')
    if (etapa < perguntas.length - 1) {
      setEtapa(etapa + 1)
    } else {
      setTela('carregando')
      const res = await fetch('/api/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo, nome, respostas: novas })
      })
      const data = await res.json()
      setRelatorio(data.relatorio)
      setProjetosCriados(data.projetos_criados || 0)
      setTela('relatorio')
    }
  }

  async function buscarEntrevistas() {
    const res = await fetch('/api/entrevistas')
    const data = await res.json()
    setEntrevistas(data || [])
  }

  async function deletarEntrevista(id) {
    if (!confirm('Deletar este relatorio?')) return
    await fetch('/api/entrevistas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    buscarEntrevistas()
    setEntrevistaAberta(null)
  }

  function abrirHistorico() {
    buscarEntrevistas()
    setTela('historico')
  }

  function diasAtras(data) {
    const diff = Math.floor((new Date() - new Date(data)) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'hoje'
    if (diff === 1) return '1 dia atras'
    return diff + ' dias atras'
  }

  function BotaoAcao({ onClick, label, icone: Icone }) {
    return (
      <button onClick={onClick} style={{ ...botaoVoltar, background: C.fundo }}>
        {Icone && <Icone size={14} />} {label}
      </button>
    )
  }

  // ── TELA: Inicio ───────────────────────────────────────────────────────────
  if (tela === 'inicio') {
    const modulos = [
      { icone: ClipboardList, titulo: 'Analise de Processo', desc: 'Entrevista com IA e relatorio de melhorias', onClick: () => setTela('formulario'), borda: C.royal },
      { icone: FolderKanban, titulo: 'Projetos', desc: 'Gerencie projetos e tarefas com prazos', href: '/projetos', borda: C.royal },
      { icone: TrendingUp, titulo: 'PMO / Dashboard', desc: 'Visao de portfolio, orcamento e riscos', href: '/pmo', borda: C.navy },
      { icone: Map, titulo: 'Roadmap', desc: 'Gerar plano de projeto com IA', href: '/roadmap', borda: C.navy, badge: 'Novo' },
      { icone: Sparkles, titulo: 'Assistente IA', desc: 'Pergunte sobre seus projetos e tarefas', href: '/assistente', borda: C.blue, badge: 'Novo' },
      { icone: Workflow, titulo: 'Modelagem BPMN', desc: 'Gerar diagrama de processo com IA', href: '/bpmn', borda: C.royal, badge: 'Novo' },
      { icone: Wallet, titulo: 'Financeiro', desc: 'Controle de lancamentos, calendario e saldos', href: '/financeiro', borda: C.verde, badge: 'Novo' },
    ]

    return (
      <AppShell
        title="Visao geral"
        subtitle="Sistema de Melhoria"
        actions={
          <button onClick={abrirHistorico} className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', border: `1px solid ${C.borda}`, color: C.textoSec, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <History size={15} /> Historico de relatorios
          </button>
        }
      >
        <div className="page-pad" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: C.textoSec, marginBottom: '28px', fontSize: '14px', textAlign: 'center' }}>Escolha o modulo que deseja usar</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {modulos.map((m, i) => {
              const Icone = m.icone
              const cardStyle = {
                background: 'white',
                border: `1px solid ${C.borda}`,
                borderTop: `3px solid ${m.borda}`,
                borderRadius: '10px',
                padding: '26px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 1px 8px rgba(15,23,42,0.05)',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'left',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }
              const inner = (
                <>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Icone size={22} color={m.borda} />
                  </div>
                  <h2 style={{ color: C.texto, margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700 }}>{m.titulo}</h2>
                  <p style={{ color: C.textoSec, margin: m.badge ? '0 0 8px' : 0, fontSize: '12px' }}>{m.desc}</p>
                  {m.badge && (
                    <span style={{ background: '#EEF2FF', color: C.royal, fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>{m.badge}</span>
                  )}
                </>
              )
              if (m.href) {
                return (
                  <a key={i} href={m.href} className="menu-card" style={cardStyle}
                    onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(30,91,198,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 1px 8px rgba(15,23,42,0.05)'; e.currentTarget.style.transform = 'none' }}
                  >{inner}</a>
                )
              }
              return (
                <div key={i} className="menu-card" style={cardStyle}
                  onClick={m.onClick}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(30,91,198,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 1px 8px rgba(15,23,42,0.05)'; e.currentTarget.style.transform = 'none' }}
                >{inner}</div>
              )
            })}
          </div>
        </div>
      </AppShell>
    )
  }

  // ── TELA: Historico ────────────────────────────────────────────────────────
  if (tela === 'historico') {
    return (
      <AppShell
        title="Historico de Relatorios"
        subtitle="Analise de Processo"
        actions={<BotaoAcao onClick={() => { setTela('inicio'); setEntrevistaAberta(null) }} label="Inicio" icone={ArrowLeft} />}
      >
        <div className="page-pad" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {entrevistas.length === 0 && (
            <div style={{ background: 'white', borderRadius: '10px', padding: '40px', textAlign: 'center', color: C.textoMudo, border: `1px solid ${C.borda}` }}>
              Nenhum relatorio encontrado
            </div>
          )}
          {entrevistaAberta ? (
            <div style={{ background: 'white', borderRadius: '10px', padding: '32px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ color: C.texto, margin: '0 0 4px' }}>{entrevistaAberta.processo}</h2>
                  <p style={{ color: C.textoMudo, fontSize: '13px', margin: 0 }}>{entrevistaAberta.responsavel} • {diasAtras(entrevistaAberta.criado_em)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEntrevistaAberta(null)} style={{ background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', color: C.royal, fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={14} /> Voltar</button>
                  <button onClick={() => deletarEntrevista(entrevistaAberta.id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', color: C.vermelho, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Trash2 size={14} /> Deletar</button>
                </div>
              </div>
              <div style={{ background: C.fundo, borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: C.texto }}>
                {entrevistaAberta.relatorio}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entrevistas.map(e => (
                <div key={e.id} style={{ background: 'white', borderRadius: '10px', padding: '18px 20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                  <div onClick={() => setEntrevistaAberta(e)} style={{ cursor: 'pointer', flex: 1 }}>
                    <p style={{ fontWeight: 700, color: C.texto, margin: '0 0 4px', fontSize: '15px' }}>{e.processo}</p>
                    <p style={{ color: C.textoMudo, fontSize: '13px', margin: 0 }}>{e.responsavel} • {diasAtras(e.criado_em)}</p>
                  </div>
                  <button onClick={() => deletarEntrevista(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '4px', marginLeft: '12px' }} title="Deletar"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    )
  }

  // ── TELA: Formulario ───────────────────────────────────────────────────────
  if (tela === 'formulario') {
    return (
      <AppShell title="Analise de Processo" subtitle="Entrevista guiada por IA" actions={<BotaoAcao onClick={() => setTela('inicio')} label="Inicio" icone={ArrowLeft} />}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '500px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
            <h2 style={{ color: C.texto, marginBottom: '24px', fontSize: '20px' }}>Novo Processo</h2>
            <input placeholder="Nome do processo (ex: Compras)" value={processo} onChange={e => setProcesso(e.target.value)}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }} />
            <input placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', color: C.texto }} />
            <button onClick={iniciarEntrevista} className="btn-hover" style={{ ...botaoPrimario, width: '100%', padding: '13px', fontSize: '15px' }}>
              Iniciar Entrevista
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── TELA: Entrevista ───────────────────────────────────────────────────────
  if (tela === 'entrevista') {
    return (
      <AppShell title={processo} subtitle={`Pergunta ${etapa + 1} de ${perguntas.length}`} actions={<BotaoAcao onClick={() => setTela('inicio')} label="Cancelar" icone={ArrowLeft} />}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '600px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: C.royal, fontWeight: 700, fontSize: '14px' }}>Pergunta {etapa + 1} de {perguntas.length}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {perguntas.map((_, i) => (
                  <div key={i} style={{ width: '28px', height: '4px', borderRadius: '2px', background: i <= etapa ? C.royal : C.borda }} />
                ))}
              </div>
            </div>
            <div style={{ background: C.fundo, borderRadius: '8px', padding: '20px', marginBottom: '20px', borderLeft: `3px solid ${C.borda}` }}>
              <p style={{ color: C.texto, fontSize: '16px', margin: 0, lineHeight: '1.6' }}>{perguntas[etapa]}</p>
            </div>
            <textarea placeholder="Digite sua resposta..." value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', color: C.texto }} />
            <button onClick={responder} className="btn-hover" style={{ ...botaoPrimario, width: '100%', marginTop: '16px', padding: '13px', fontSize: '15px' }}>
              {etapa < perguntas.length - 1 ? 'Proxima Pergunta →' : 'Gerar Relatorio'}
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── TELA: Carregando ───────────────────────────────────────────────────────
  if (tela === 'carregando') {
    return (
      <div style={{ fontFamily: 'var(--font-nunito), Arial, sans-serif', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} color={C.royal} className="spin" style={{ marginBottom: '20px' }} />
          <p style={{ color: C.texto, fontSize: '18px', fontWeight: 700 }}>Analisando com IA...</p>
          <p style={{ color: C.textoSec, fontSize: '14px' }}>Isso pode levar alguns segundos</p>
        </div>
      </div>
    )
  }

  // ── TELA: Relatorio ────────────────────────────────────────────────────────
  if (tela === 'relatorio') {
    return (
      <AppShell title={`Relatorio: ${processo}`} subtitle={`Responsavel: ${nome}`} actions={<BotaoAcao onClick={() => setTela('inicio')} label="Inicio" icone={ArrowLeft} />}>
        <div className="page-pad" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '36px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
            <div style={{ background: C.fundo, borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: C.texto, marginBottom: '24px', border: `1px solid ${C.borda}` }}>
              {relatorio}
            </div>
            {projetosCriados > 0 && (
              <div style={{ background: '#f0fdf4', border: `1px solid ${C.verde}`, borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#14532d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {projetosCriados} projeto(s) criado(s) automaticamente!
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => setTela('inicio')} className="btn-ghost-hover" style={{ flex: 1, minWidth: '140px', padding: '12px', background: 'white', color: C.royal, border: `1px solid ${C.borda}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Voltar ao Inicio
              </button>
              <a href="/projetos" className="btn-hover" style={{ flex: 1, minWidth: '140px', padding: '12px', background: C.royal, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>
                Ver Projetos →
              </a>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }
}
