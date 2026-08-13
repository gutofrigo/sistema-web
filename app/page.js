'use client'
import { useState } from 'react'

const perguntas = [
  'Descreva como o processo funciona atualmente, do inicio ao fim.',
  'Quais sao os principais problemas ou gargalos que voce enfrenta nesse processo?',
  'Quanto tempo em media esse processo leva? Onde ocorrem os maiores atrasos?',
  'Quais ferramentas ou sistemas sao usados? Eles atendem bem?',
  'Se voce pudesse mudar uma coisa nesse processo, o que seria?'
]

const C = {
  navy:      '#0B1F3A',
  royal:     '#1E5BC6',
  blue:      '#3B82F6',
  fundo:     '#F1F4F8',
  borda:     '#D1D9E6',
  texto:     '#0B1F3A',
  textoSec:  '#4A5568',
  textoMudo: '#8FA3B1',
  verde:     '#16A34A',
  ambar:     '#F59E0B',
  vermelho:  '#DC2626',
}

export default function Home() {
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

  // ── HEADER reutilizavel ─────────────────────────────────────────────────────
  function Header({ titulo, subtitulo, direita }) {
    return (
      <div style={{ background: C.navy, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 2px' }}>Sistema de Melhoria</p>
          <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{titulo}</h1>
          {subtitulo && <p style={{ color: C.textoMudo, fontSize: '12px', margin: '2px 0 0' }}>{subtitulo}</p>}
        </div>
        {direita && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{direita}</div>}
      </div>
    )
  }

  function BotaoVoltar({ onClick, href, label = '← Voltar' }) {
    const style = {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '7px 16px', background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px',
      color: 'white', fontSize: '13px', fontWeight: 'bold',
      cursor: 'pointer', textDecoration: 'none',
    }
    if (href) return <a href={href} style={style}>{label}</a>
    return <button onClick={onClick} style={style}>{label}</button>
  }

  // ── TELA: Inicio ───────────────────────────────────────────────────────────
  if (tela === 'inicio') {
    const modulos = [
      { icone: '📋', titulo: 'Analise de Processo', desc: 'Entrevista com IA e relatorio de melhorias', onClick: () => setTela('formulario'), borda: C.royal },
      { icone: '📁', titulo: 'Projetos', desc: 'Gerencie projetos e tarefas com prazos', href: '/projetos', borda: C.royal },
      { icone: '📊', titulo: 'Dashboard', desc: 'Visao geral do sistema', href: '/dashboard', borda: C.royal },
      { icone: '📈', titulo: 'PMO', desc: 'Visao de portfolio, orcamento e riscos', href: '/pmo', borda: C.navy, badge: 'Novo' },
      { icone: '🗺️', titulo: 'Roadmap', desc: 'Gerar plano de projeto com IA', href: '/roadmap', borda: C.navy, badge: 'Novo' },
      { icone: '✨', titulo: 'Assistente IA', desc: 'Pergunte sobre seus projetos e tarefas', href: '/assistente', borda: C.blue, badge: 'Novo' },
      { icone: '🔷', titulo: 'Modelagem BPMN', desc: 'Gerar diagrama de processo com IA', href: '/bpmn', borda: C.royal, badge: 'Novo' },
      { icone: '💰', titulo: 'Financeiro', desc: 'Controle de lancamentos, calendario e saldos', href: '/financeiro', borda: C.verde, badge: 'Novo' },
    ]

    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: C.navy, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Sistema de Melhoria</h1>
            <p style={{ color: C.textoMudo, fontSize: '13px', margin: 0 }}>Plataforma corporativa de gestao de processos</p>
          </div>
          <button
            onClick={abrirHistorico}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: '13px', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Ver historico de relatorios
          </button>
        </div>

        <div className="page-pad" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: C.textoSec, marginBottom: '28px', fontSize: '14px', textAlign: 'center' }}>Escolha o modulo que deseja usar</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {modulos.map((m, i) => {
              const cardStyle = {
                background: 'white',
                border: `1px solid ${C.borda}`,
                borderLeft: `3px solid ${m.borda}`,
                borderRadius: '8px',
                padding: '28px',
                cursor: 'pointer',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'left',
                transition: 'box-shadow 0.15s',
              }
              const inner = (
                <>
                  <div style={{ fontSize: '40px', marginBottom: '14px' }}>{m.icone}</div>
                  <h2 style={{ color: C.texto, margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>{m.titulo}</h2>
                  <p style={{ color: C.textoSec, margin: m.badge ? '0 0 8px' : 0, fontSize: '12px' }}>{m.desc}</p>
                  {m.badge && (
                    <span style={{ background: '#EEF2FF', color: C.royal, fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>{m.badge}</span>
                  )}
                </>
              )
              if (m.href) {
                return (
                  <a key={i} href={m.href} className="menu-card" style={cardStyle}
                    onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,91,198,0.15)' }}
                    onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)' }}
                  >{inner}</a>
                )
              }
              return (
                <div key={i} className="menu-card" style={cardStyle}
                  onClick={m.onClick}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,91,198,0.15)' }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)' }}
                >{inner}</div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── TELA: Historico ────────────────────────────────────────────────────────
  if (tela === 'historico') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
        <Header
          titulo="📋 Historico de Relatorios"
          direita={
            <>
              <BotaoVoltar onClick={() => { setTela('inicio'); setEntrevistaAberta(null) }} label="← Inicio" />
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>🏠 Home</a>
            </>
          }
        />
        <div className="page-pad" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {entrevistas.length === 0 && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '40px', textAlign: 'center', color: C.textoMudo, border: `1px solid ${C.borda}` }}>
              Nenhum relatorio encontrado
            </div>
          )}
          {entrevistaAberta ? (
            <div style={{ background: 'white', borderRadius: '8px', padding: '32px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ color: C.texto, margin: '0 0 4px' }}>{entrevistaAberta.processo}</h2>
                  <p style={{ color: C.textoMudo, fontSize: '13px', margin: 0 }}>{entrevistaAberta.responsavel} • {diasAtras(entrevistaAberta.criado_em)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEntrevistaAberta(null)} style={{ background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', color: C.royal, fontSize: '13px', fontWeight: 'bold' }}>← Voltar</button>
                  <button onClick={() => deletarEntrevista(entrevistaAberta.id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', color: C.vermelho, fontSize: '13px' }}>🗑️ Deletar</button>
                </div>
              </div>
              <div style={{ background: C.fundo, borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: C.texto }}>
                {entrevistaAberta.relatorio}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entrevistas.map(e => (
                <div key={e.id} style={{ background: 'white', borderRadius: '8px', padding: '18px 20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div onClick={() => setEntrevistaAberta(e)} style={{ cursor: 'pointer', flex: 1 }}>
                    <p style={{ fontWeight: 'bold', color: C.texto, margin: '0 0 4px', fontSize: '15px' }}>{e.processo}</p>
                    <p style={{ color: C.textoMudo, fontSize: '13px', margin: 0 }}>{e.responsavel} • {diasAtras(e.criado_em)}</p>
                  </div>
                  <button onClick={() => deletarEntrevista(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: C.textoMudo, padding: '4px', marginLeft: '12px' }} title="Deletar">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── TELA: Formulario ───────────────────────────────────────────────────────
  if (tela === 'formulario') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
        <Header
          titulo="Analise de Processo"
          subtitulo="Entrevista guiada por IA"
          direita={<BotaoVoltar onClick={() => setTela('inicio')} label="← Inicio" />}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '36px', width: '100%', maxWidth: '500px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <h2 style={{ color: C.texto, marginBottom: '24px', fontSize: '20px' }}>Novo Processo</h2>
            <input placeholder="Nome do processo (ex: Compras)" value={processo} onChange={e => setProcesso(e.target.value)}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }} />
            <input placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', color: C.texto }} />
            <button onClick={iniciarEntrevista} style={{ width: '100%', padding: '13px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
              Iniciar Entrevista
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── TELA: Entrevista ───────────────────────────────────────────────────────
  if (tela === 'entrevista') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
        <Header
          titulo={processo}
          subtitulo={`Pergunta ${etapa + 1} de ${perguntas.length}`}
          direita={<BotaoVoltar onClick={() => setTela('inicio')} label="← Cancelar" />}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '36px', width: '100%', maxWidth: '600px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: C.royal, fontWeight: 'bold', fontSize: '14px' }}>Pergunta {etapa + 1} de {perguntas.length}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {perguntas.map((_, i) => (
                  <div key={i} style={{ width: '28px', height: '4px', borderRadius: '2px', background: i <= etapa ? C.royal : C.borda }} />
                ))}
              </div>
            </div>
            <div style={{ background: C.fundo, borderRadius: '6px', padding: '20px', marginBottom: '20px', borderLeft: `3px solid ${C.borda}` }}>
              <p style={{ color: C.texto, fontSize: '16px', margin: 0, lineHeight: '1.6' }}>{perguntas[etapa]}</p>
            </div>
            <textarea placeholder="Digite sua resposta..." value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', color: C.texto }} />
            <button onClick={responder} style={{ width: '100%', marginTop: '16px', padding: '13px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
              {etapa < perguntas.length - 1 ? 'Proxima Pergunta →' : 'Gerar Relatorio'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── TELA: Carregando ───────────────────────────────────────────────────────
  if (tela === 'carregando') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: C.texto, fontSize: '18px', fontWeight: 'bold' }}>Analisando com IA...</p>
          <p style={{ color: C.textoSec, fontSize: '14px' }}>Isso pode levar alguns segundos</p>
        </div>
      </div>
    )
  }

  // ── TELA: Relatorio ────────────────────────────────────────────────────────
  if (tela === 'relatorio') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
        <Header
          titulo={`Relatorio: ${processo}`}
          subtitulo={`Responsavel: ${nome}`}
          direita={<BotaoVoltar onClick={() => setTela('inicio')} label="← Inicio" />}
        />
        <div className="page-pad" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '36px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ background: C.fundo, borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: C.texto, marginBottom: '24px', border: `1px solid ${C.borda}` }}>
              {relatorio}
            </div>
            {projetosCriados > 0 && (
              <div style={{ background: '#f0fdf4', border: `1px solid ${C.verde}`, borderRadius: '6px', padding: '16px', marginBottom: '20px', color: '#14532d' }}>
                ✅ {projetosCriados} projeto(s) criado(s) automaticamente!
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => setTela('inicio')} style={{ flex: 1, minWidth: '140px', padding: '12px', background: C.fundo, color: C.royal, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                ← Voltar ao Inicio
              </button>
              <a href="/projetos" style={{ flex: 1, minWidth: '140px', padding: '12px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>
                Ver Projetos →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
