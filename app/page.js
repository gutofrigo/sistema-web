'use client'
import { useState } from 'react'
const perguntas = [
  'Descreva como o processo funciona atualmente, do inicio ao fim.',
  'Quais sao os principais problemas ou gargalos que voce enfrenta nesse processo?',
  'Quanto tempo em media esse processo leva? Onde ocorrem os maiores atrasos?',
  'Quais ferramentas ou sistemas sao usados? Eles atendem bem?',
  'Se voce pudesse mudar uma coisa nesse processo, o que seria?'
]
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
  if (tela === 'inicio') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="page-pad" style={{ textAlign: 'center', maxWidth: '1200px' }}>
          <h1 style={{ fontSize: '28px', color: '#1c2b3a', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Sistema de Melhoria</h1>
          <p style={{ color: '#5a6a7a', marginBottom: '40px', fontSize: '15px' }}>Escolha o modulo que deseja usar</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div
              onClick={() => setTela('formulario')}
              className="menu-card"
              style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', borderRadius: '8px', padding: '28px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              onMouseOver={e => { e.currentTarget.style.background = '#f0f4f8' }}
              onMouseOut={e => { e.currentTarget.style.background = 'white' }}
            >
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>📋</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Analise de Processo</h2>
              <p style={{ color: '#5a6a7a', margin: 0, fontSize: '12px' }}>Entrevista com IA e relatorio de melhorias</p>
            </div>
            <a href="/projetos" className="menu-card" style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', borderRadius: '8px', padding: '28px', cursor: 'pointer', textDecoration: 'none', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>📁</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Projetos</h2>
              <p style={{ color: '#5a6a7a', margin: 0, fontSize: '12px' }}>Gerencie projetos e tarefas com prazos</p>
            </a>
            <a href="/dashboard" className="menu-card" style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', borderRadius: '8px', padding: '28px', cursor: 'pointer', textDecoration: 'none', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>📊</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Dashboard</h2>
              <p style={{ color: '#5a6a7a', margin: 0, fontSize: '12px' }}>Visao geral do sistema</p>
            </a>
            <a href="/roadmap" className="menu-card" style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #1c2b3a', borderRadius: '8px', padding: '28px', cursor: 'pointer', textDecoration: 'none', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>🗺️</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Roadmap</h2>
              <p style={{ color: '#5a6a7a', margin: '0 0 8px', fontSize: '12px' }}>Gerar plano de projeto com IA</p>
              <span style={{ background: '#e8edf2', color: '#2e4a63', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>Novo</span>
            </a>
            <a href="/assistente" className="menu-card" style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #3d5a73', borderRadius: '8px', padding: '28px', cursor: 'pointer', textDecoration: 'none', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>✨</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Assistente IA</h2>
              <p style={{ color: '#5a6a7a', margin: '0 0 8px', fontSize: '12px' }}>Pergunte sobre seus projetos e tarefas</p>
              <span style={{ background: '#e8edf2', color: '#2e4a63', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>Novo</span>
            </a>
            <a href="/bpmn" className="menu-card" style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', borderRadius: '8px', padding: '28px', cursor: 'pointer', textDecoration: 'none', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔷</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Modelagem BPMN</h2>
              <p style={{ color: '#5a6a7a', margin: '0 0 8px', fontSize: '12px' }}>Gerar diagrama de processo com IA</p>
              <span style={{ background: '#e8edf2', color: '#2e4a63', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>Novo</span>
            </a>
            <a href="/financeiro" className="menu-card" style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '28px', cursor: 'pointer', textDecoration: 'none', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>💰</div>
              <h2 style={{ color: '#1c2b3a', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold' }}>Financeiro</h2>
              <p style={{ color: '#5a6a7a', margin: '0 0 8px', fontSize: '12px' }}>Controle de lancamentos, calendario e saldos</p>
              <span style={{ background: '#e8edf2', color: '#2e4a63', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>Novo</span>
            </a>
          </div>
          <button
            onClick={abrirHistorico}
            style={{ marginTop: '28px', background: 'none', border: 'none', color: '#8fa3b1', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Ver historico de relatorios
          </button>
        </div>
      </div>
    )
  }
  if (tela === 'historico') {
    return (
      <div className="page-pad" style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <button onClick={() => { setTela('inicio'); setEntrevistaAberta(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', color: '#2e4a63', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Voltar
            </button>
            <h1 style={{ color: '#1c2b3a', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>📋 Historico de Relatorios</h1>
          </div>
          {entrevistas.length === 0 && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#8fa3b1', border: '1px solid #d6dbe0' }}>
              Nenhum relatorio encontrado
            </div>
          )}
          {entrevistaAberta ? (
            <div style={{ background: 'white', borderRadius: '8px', padding: '32px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ color: '#1c2b3a', margin: '0 0 4px' }}>{entrevistaAberta.processo}</h2>
                  <p style={{ color: '#8fa3b1', fontSize: '13px', margin: 0 }}>{entrevistaAberta.responsavel} • {diasAtras(entrevistaAberta.criado_em)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEntrevistaAberta(null)} style={{ background: '#f4f5f7', border: '1px solid #d6dbe0', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', color: '#2e4a63', fontSize: '13px', fontWeight: 'bold' }}>← Voltar</button>
                  <button onClick={() => deletarEntrevista(entrevistaAberta.id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', color: '#dc2626', fontSize: '13px' }}>🗑️ Deletar</button>
                </div>
              </div>
              <div style={{ background: '#f4f5f7', borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#1c2b3a' }}>
                {entrevistaAberta.relatorio}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entrevistas.map(e => (
                <div key={e.id} style={{ background: 'white', borderRadius: '8px', padding: '18px 20px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => setEntrevistaAberta(e)} style={{ cursor: 'pointer', flex: 1 }}>
                    <p style={{ fontWeight: 'bold', color: '#1c2b3a', margin: '0 0 4px', fontSize: '15px' }}>{e.processo}</p>
                    <p style={{ color: '#8fa3b1', fontSize: '13px', margin: 0 }}>{e.responsavel} • {diasAtras(e.criado_em)}</p>
                  </div>
                  <button onClick={() => deletarEntrevista(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#8fa3b1', padding: '4px', marginLeft: '12px' }} title="Deletar">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  if (tela === 'formulario') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '500px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <button onClick={() => setTela('inicio')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: '#f4f5f7', border: '1px solid #d6dbe0', borderRadius: '6px', color: '#2e4a63', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>← Voltar</button>
          <h2 style={{ color: '#1c2b3a', marginBottom: '24px', fontSize: '20px' }}>Analise de Processo</h2>
          <input placeholder="Nome do processo (ex: Compras)" value={processo} onChange={e => setProcesso(e.target.value)}
            style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1c2b3a' }} />
          <input placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)}
            style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', color: '#1c2b3a' }} />
          <button onClick={iniciarEntrevista} style={{ width: '100%', padding: '13px', background: '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            Iniciar Entrevista
          </button>
        </div>
      </div>
    )
  }
  if (tela === 'entrevista') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '600px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ color: '#2e4a63', fontWeight: 'bold', fontSize: '14px' }}>Pergunta {etapa + 1} de {perguntas.length}</span>
            <span style={{ color: '#8fa3b1', fontSize: '14px' }}>{processo}</span>
          </div>
          <div style={{ background: '#f4f5f7', borderRadius: '6px', padding: '20px', marginBottom: '20px', borderLeft: '3px solid #d6dbe0' }}>
            <p style={{ color: '#1c2b3a', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>{perguntas[etapa]}</p>
          </div>
          <textarea placeholder="Digite sua resposta..." value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
            style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', color: '#1c2b3a' }} />
          <button onClick={responder} style={{ width: '100%', marginTop: '16px', padding: '13px', background: '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            {etapa < perguntas.length - 1 ? 'Proxima Pergunta' : 'Gerar Relatorio'}
          </button>
        </div>
      </div>
    )
  }
  if (tela === 'carregando') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#1c2b3a', fontSize: '18px', fontWeight: 'bold' }}>Analisando com IA...</p>
        </div>
      </div>
    )
  }
  if (tela === 'relatorio') {
    return (
      <div className="page-pad" style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '8px', padding: '40px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#1c2b3a', marginBottom: '8px', fontSize: '20px' }}>Relatorio: {processo}</h2>
          <p style={{ color: '#5a6a7a', marginBottom: '24px', fontSize: '14px' }}>Responsavel: {nome}</p>
          <div style={{ background: '#f4f5f7', borderRadius: '8px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#1c2b3a', marginBottom: '24px', border: '1px solid #d6dbe0' }}>
            {relatorio}
          </div>
          {projetosCriados > 0 && (
            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '16px', marginBottom: '20px', color: '#065f46' }}>
              {projetosCriados} projeto(s) criado(s) automaticamente!
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setTela('inicio')} style={{ flex: 1, padding: '12px', background: '#f4f5f7', color: '#2e4a63', border: '1px solid #d6dbe0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              Voltar ao Inicio
            </button>
            <a href="/projetos" style={{ flex: 1, padding: '12px', background: '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>
              Ver Projetos
            </a>
          </div>
        </div>
      </div>
    )
  }
}
