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
  if (tela === 'inicio') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', padding: '40px' }}>
          <h1 style={{ fontSize: '32px', color: '#1e293b', marginBottom: '10px' }}>Sistema de Melhoria</h1>
          <p style={{ color: '#64748b', marginBottom: '50px', fontSize: '16px' }}>Escolha o modulo que deseja usar</p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            <div
              onClick={() => setTela('formulario')}
              style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '32px', width: '200px', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h2 style={{ color: '#1e293b', margin: '0 0 8px 0', fontSize: '18px' }}>Analise de Processo</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Entrevista com IA e relatorio de melhorias</p>
            </div>
            <a
              href="/projetos"
              style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '32px', width: '200px', cursor: 'pointer', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <h2 style={{ color: '#1e293b', margin: '0 0 8px 0', fontSize: '18px' }}>Projetos</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Gerencie projetos e tarefas com prazos</p>
            </a>
            <a
              href="/dashboard"
              style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '32px', width: '200px', cursor: 'pointer', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h2 style={{ color: '#1e293b', margin: '0 0 8px 0', fontSize: '18px' }}>Dashboard</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Visao geral do sistema</p>
            </a>
          </div>
        </div>
      </div>
    )
  }
  if (tela === 'formulario') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setTela('inicio')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}>
            Voltar
          </button>
          <h2 style={{ color: '#1e293b', marginBottom: '24px' }}>Analise de Processo</h2>
          <input
            placeholder="Nome do processo (ex: Compras)"
            value={processo}
            onChange={e => setProcesso(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', color: `#1e293b` }}
          />
          <input
            placeholder="Seu nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', color: `#1e293b` }}
          />
          <button
            onClick={iniciarEntrevista}
            style={{ width: '100%', padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            Iniciar Entrevista
          </button>
        </div>
      </div>
    )
  }
  if (tela === 'entrevista') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ color: '#6366f1', fontWeight: 'bold' }}>Pergunta {etapa + 1} de {perguntas.length}</span>
            <span style={{ color: '#94a3b8' }}>{processo}</span>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <p style={{ color: '#1e293b', fontSize: '17px', margin: 0, lineHeight: '1.6' }}>{perguntas[etapa]}</p>
          </div>
          <textarea
            placeholder="Digite sua resposta..."
            value={resposta}
            onChange={e => setResposta(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box', color: `#1e293b` }}
          />
          <button
            onClick={responder}
            style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            {etapa < perguntas.length - 1 ? 'Proxima Pergunta' : 'Gerar Relatorio'}
          </button>
        </div>
      </div>
    )
  }
  if (tela === 'carregando') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#1e293b', fontSize: '18px' }}>Analisando com IA...</p>
        </div>
      </div>
    )
  }
  if (tela === 'relatorio') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Relatorio: {processo}</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Responsavel: {nome}</p>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>
            {relatorio}
          </div>
          {projetosCriados > 0 && (
            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#065f46' }}>
              {projetosCriados} projeto(s) criado(s) automaticamente!
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setTela('inicio')} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>
              Voltar ao Inicio
            </button>
            <a href="/projetos" style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', textAlign: 'center', textDecoration: 'none' }}>
              Ver Projetos
            </a>
          </div>
        </div>
      </div>
    )
  }
}