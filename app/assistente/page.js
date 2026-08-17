'use client'
import { useState, useEffect, useRef } from 'react'
import { Sparkles, LayoutDashboard, MessageSquare, ClipboardList, History, ArrowLeft, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C, botaoVoltar, botaoPrimario } from '../theme'

const perguntasSugeridas = [
  'Quais projetos estao em risco de atraso?',
  'Quais tarefas vencem essa semana?',
  'Resuma o que foi concluido',
  'Quem tem mais tarefas pendentes?',
  'Qual projeto tem mais tarefas atrasadas?'
]

const perguntasEntrevista = [
  'Descreva como o processo funciona atualmente, do inicio ao fim.',
  'Quais sao os principais problemas ou gargalos que voce enfrenta nesse processo?',
  'Quanto tempo em media esse processo leva? Onde ocorrem os maiores atrasos?',
  'Quais ferramentas ou sistemas sao usados? Eles atendem bem?',
  'Se voce pudesse mudar uma coisa nesse processo, o que seria?'
]

function BotaoAcao({ onClick, label, icone: Icone }) {
  return (
    <button onClick={onClick} style={{ ...botaoVoltar, background: C.fundo }}>
      {Icone && <Icone size={14} />} {label}
    </button>
  )
}

function diasAtras(data) {
  const diff = Math.floor((new Date() - new Date(data)) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'hoje'
  if (diff === 1) return '1 dia atras'
  return diff + ' dias atras'
}

export default function Assistente() {
  const [modo, setModo] = useState('chat')

  // ── Estado: Chat ──────────────────────────────────────────────────────────
  const [mensagens, setMensagens] = useState([
    { tipo: 'assistente', texto: 'Ola! Sou seu assistente de gestao. Tenho acesso a todos os seus projetos, tarefas e roadmaps. Como posso ajudar?' }
  ])
  const [pergunta, setPergunta] = useState('')
  const [carregando, setCarregando] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    if (fimRef.current) fimRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar(texto) {
    const p = texto || pergunta
    if (!p.trim() || carregando) return
    const novasMensagens = [...mensagens, { tipo: 'usuario', texto: p }]
    setMensagens(novasMensagens)
    setPergunta('')
    setCarregando(true)
    const historico = novasMensagens.slice(1)
    const res = await fetch('/api/assistente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta: p, historico })
    })
    const data = await res.json()
    if (data.erro) {
      setMensagens([...novasMensagens, { tipo: 'assistente', texto: 'Desculpe, ocorreu um erro. Tente novamente.' }])
    } else {
      setMensagens([...novasMensagens, { tipo: 'assistente', texto: data.resposta }])
    }
    setCarregando(false)
  }

  function teclaEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  // ── Estado: Analise de Processo (entrevista) ─────────────────────────────
  const [subTela, setSubTela] = useState('formulario')
  const [processo, setProcesso] = useState('')
  const [nome, setNome] = useState('')
  const [etapa, setEtapa] = useState(0)
  const [respostas, setRespostas] = useState([])
  const [respostaEntrevista, setRespostaEntrevista] = useState('')
  const [relatorio, setRelatorio] = useState('')
  const [projetosCriados, setProjetosCriados] = useState(0)
  const [entrevistas, setEntrevistas] = useState([])
  const [entrevistaAberta, setEntrevistaAberta] = useState(null)

  function iniciarEntrevista() {
    if (!processo || !nome) return alert('Preencha todos os campos')
    setSubTela('entrevista')
    setEtapa(0)
    setRespostas([])
  }

  async function responderEntrevista() {
    if (!respostaEntrevista.trim()) return
    const novas = [...respostas, { pergunta: perguntasEntrevista[etapa], resposta: respostaEntrevista }]
    setRespostas(novas)
    setRespostaEntrevista('')
    if (etapa < perguntasEntrevista.length - 1) {
      setEtapa(etapa + 1)
    } else {
      setSubTela('carregando')
      const res = await fetch('/api/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo, nome, respostas: novas })
      })
      const data = await res.json()
      setRelatorio(data.relatorio)
      setProjetosCriados(data.projetos_criados || 0)
      setSubTela('relatorio')
    }
  }

  async function buscarEntrevistas() {
    const res = await fetch('/api/entrevistas')
    const data = await res.json()
    setEntrevistas(data || [])
  }

  async function deletarEntrevista(id) {
    if (!confirm('Deletar este relatorio?')) return
    await fetch('/api/entrevistas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarEntrevistas()
    setEntrevistaAberta(null)
  }

  function abrirHistorico() {
    buscarEntrevistas()
    setSubTela('historico')
  }

  function novaEntrevista() {
    setProcesso('')
    setNome('')
    setSubTela('formulario')
  }

  const tabs = (
    <div style={{ display: 'inline-flex', background: C.fundo, borderRadius: '10px', padding: '4px', gap: '4px' }}>
      <button onClick={() => setModo('chat')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: modo === 'chat' ? C.branco : 'transparent', color: modo === 'chat' ? C.royal : C.textoSec, boxShadow: modo === 'chat' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
        <MessageSquare size={14} /> Assistente
      </button>
      <button onClick={() => setModo('entrevista')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: modo === 'entrevista' ? C.branco : 'transparent', color: modo === 'entrevista' ? C.royal : C.textoSec, boxShadow: modo === 'entrevista' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
        <ClipboardList size={14} /> Analise de Processo
      </button>
    </div>
  )

  // ── Modo: Chat ────────────────────────────────────────────────────────────
  if (modo === 'chat') {
    return (
      <AppShell title="Assistente IA" subtitle="Pergunte sobre seus projetos e tarefas" actions={<>{tabs}<a href="/pmo" className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.branco, border: `1px solid ${C.borda}`, color: C.texto, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}><LayoutDashboard size={14} /> PMO</a></>}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mensagens.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.tipo === 'usuario' ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '80%' }}>
                  {m.tipo === 'assistente' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={15} color={C.textoSobreAccent} /></div>
                  )}
                  <div style={{
                    background: m.tipo === 'usuario' ? C.royal : C.branco,
                    color: m.tipo === 'usuario' ? C.textoSobreAccent : C.texto,
                    borderRadius: m.tipo === 'usuario' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    border: m.tipo === 'assistente' ? `1px solid ${C.borda}` : 'none',
                    whiteSpace: 'pre-wrap',
                    boxShadow: m.tipo === 'assistente' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                  }}>
                    {m.texto}
                  </div>
                </div>
              </div>
            ))}
            {carregando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={15} color={C.textoSobreAccent} /></div>
                  <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '0 12px 12px 12px', padding: '12px 16px', color: C.textoMudo, fontSize: '14px' }}>
                    Analisando seus dados...
                  </div>
                </div>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {mensagens.length === 1 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '13px', color: C.textoMudo, marginBottom: '10px' }}>Sugestoes de perguntas:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {perguntasSugeridas.map((s, i) => (
                  <button key={i} onClick={() => enviar(s)} style={{ fontSize: '13px', padding: '7px 14px', borderRadius: '20px', background: C.branco, color: C.royal, border: `1px solid ${C.borda}`, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: C.branco, borderTop: `1px solid ${C.borda}`, padding: '16px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px' }}>
            <textarea
              placeholder="Pergunte sobre seus projetos, tarefas ou roadmaps... (Enter para enviar)"
              value={pergunta}
              onChange={e => setPergunta(e.target.value)}
              onKeyDown={teclaEnter}
              rows={2}
              style={{ flex: 1, padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', color: C.texto, fontFamily: 'var(--font-nunito), Arial, sans-serif' }}
            />
            <button
              onClick={() => enviar()}
              disabled={carregando || !pergunta.trim()}
              style={{ padding: '12px 20px', background: carregando || !pergunta.trim() ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 'bold', alignSelf: 'flex-end' }}
            >
              Enviar
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Modo: Analise de Processo — Historico ────────────────────────────────
  if (subTela === 'historico') {
    return (
      <AppShell title="Historico de Relatorios" subtitle="Analise de Processo" actions={<>{tabs}<BotaoAcao onClick={() => { setSubTela('formulario'); setEntrevistaAberta(null) }} label="Nova entrevista" icone={ArrowLeft} /></>}>
        <div className="page-pad" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {entrevistas.length === 0 && (
            <div style={{ background: C.branco, borderRadius: '10px', padding: '40px', textAlign: 'center', color: C.textoMudo, border: `1px solid ${C.borda}` }}>
              Nenhum relatorio encontrado
            </div>
          )}
          {entrevistaAberta ? (
            <div style={{ background: C.branco, borderRadius: '10px', padding: '32px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
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
                <div key={e.id} style={{ background: C.branco, borderRadius: '10px', padding: '18px 20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
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

  // ── Modo: Analise de Processo — Formulario ───────────────────────────────
  if (subTela === 'formulario') {
    return (
      <AppShell title="Analise de Processo" subtitle="Entrevista guiada por IA" actions={<>{tabs}<BotaoAcao onClick={abrirHistorico} label="Historico" icone={History} /></>}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
          <div style={{ background: C.branco, borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '500px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
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

  // ── Modo: Analise de Processo — Entrevista ───────────────────────────────
  if (subTela === 'entrevista') {
    return (
      <AppShell title={processo} subtitle={`Pergunta ${etapa + 1} de ${perguntasEntrevista.length}`} actions={<BotaoAcao onClick={novaEntrevista} label="Cancelar" icone={ArrowLeft} />}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
          <div style={{ background: C.branco, borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '600px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: C.royal, fontWeight: 700, fontSize: '14px' }}>Pergunta {etapa + 1} de {perguntasEntrevista.length}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {perguntasEntrevista.map((_, i) => (
                  <div key={i} style={{ width: '28px', height: '4px', borderRadius: '2px', background: i <= etapa ? C.royal : C.borda }} />
                ))}
              </div>
            </div>
            <div style={{ background: C.fundo, borderRadius: '8px', padding: '20px', marginBottom: '20px', borderLeft: `3px solid ${C.borda}` }}>
              <p style={{ color: C.texto, fontSize: '16px', margin: 0, lineHeight: '1.6' }}>{perguntasEntrevista[etapa]}</p>
            </div>
            <textarea placeholder="Digite sua resposta..." value={respostaEntrevista} onChange={e => setRespostaEntrevista(e.target.value)} rows={4}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', color: C.texto }} />
            <button onClick={responderEntrevista} className="btn-hover" style={{ ...botaoPrimario, width: '100%', marginTop: '16px', padding: '13px', fontSize: '15px' }}>
              {etapa < perguntasEntrevista.length - 1 ? 'Proxima Pergunta →' : 'Gerar Relatorio'}
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Modo: Analise de Processo — Carregando ───────────────────────────────
  if (subTela === 'carregando') {
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

  // ── Modo: Analise de Processo — Relatorio ────────────────────────────────
  if (subTela === 'relatorio') {
    return (
      <AppShell title={`Relatorio: ${processo}`} subtitle={`Responsavel: ${nome}`} actions={<BotaoAcao onClick={novaEntrevista} label="Nova entrevista" icone={ArrowLeft} />}>
        <div className="page-pad" style={{ maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: C.branco, borderRadius: '10px', padding: '36px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>
            <div style={{ background: C.fundo, borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: C.texto, marginBottom: '24px', border: `1px solid ${C.borda}` }}>
              {relatorio}
            </div>
            {projetosCriados > 0 && (
              <div style={{ background: '#f0fdf4', border: `1px solid ${C.verde}`, borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#14532d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {projetosCriados} projeto(s) criado(s) automaticamente!
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={novaEntrevista} className="btn-ghost-hover" style={{ flex: 1, minWidth: '140px', padding: '12px', background: C.branco, color: C.royal, border: `1px solid ${C.borda}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Nova entrevista
              </button>
              <a href="/projetos" className="btn-hover" style={{ flex: 1, minWidth: '140px', padding: '12px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>
                Ver Projetos →
              </a>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }
}
