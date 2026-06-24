'use client'
import { useState, useEffect } from 'react'

const C = {
  navy:      '#0B1F3A',
  royal:     '#1E5BC6',
  fundo:     '#F1F4F8',
  borda:     '#D1D9E6',
  texto:     '#0B1F3A',
  textoSec:  '#4A5568',
  textoMudo: '#8FA3B1',
  verde:     '#16A34A',
  ambar:     '#F59E0B',
  vermelho:  '#DC2626',
}

export default function Dashboard() {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    setCarregando(true)
    const res = await fetch('/api/dashboard')
    const data = await res.json()
    setDados(data)
    setCarregando(false)
  }

  function corStatus(status) {
    if (status === 'concluido') return { bg: '#f0fdf4', text: '#166534' }
    if (status === 'em_andamento') return { bg: '#EEF2FF', text: '#1e40af' }
    return { bg: '#fffbeb', text: '#92400e' }
  }

  function labelStatus(status) {
    if (status === 'concluido') return 'Concluido'
    if (status === 'em_andamento') return 'Em andamento'
    return 'Pendente'
  }

  function corPrazo(dataEntrega) {
    if (!dataEntrega) return { bg: C.fundo, icon: C.textoMudo, texto: 'Sem prazo' }
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const entrega = new Date(dataEntrega + 'T12:00:00')
    const diff = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { bg: '#fef2f2', icon: C.vermelho, texto: 'Venceu ' + Math.abs(diff) + ' dia(s) atras' }
    if (diff === 0) return { bg: '#fffbeb', icon: C.ambar, texto: 'Vence hoje' }
    return { bg: C.fundo, icon: C.textoSec, texto: 'Vence em ' + diff + ' dia(s)' }
  }

  function formatarData(data) {
    if (!data) return ''
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function diasAtras(data) {
    const diff = Math.floor((new Date() - new Date(data)) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'hoje'
    if (diff === 1) return '1 dia atras'
    return diff + ' dias atras'
  }

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }

  if (carregando) {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textoSec, fontSize: '15px' }}>Carregando dashboard...</p>
      </div>
    )
  }

  if (!dados || dados.erro) {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.vermelho }}>Erro ao carregar dados</p>
      </div>
    )
  }

  const { contadores, projetosRecentes, tarefasProximas, entrevistasRecentes } = dados
  const totalTarefas = contadores.pendentes + contadores.emAndamento + contadores.concluidas
  const taxaConclusao = totalTarefas > 0 ? Math.round((contadores.concluidas / totalTarefas) * 100) : 0

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: C.navy, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 2px' }}>Sistema de Melhoria</p>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/" style={btnHeader}>← Inicio</a>
          <a href="/projetos" style={{ ...btnHeader, background: 'transparent', fontWeight: 'normal', color: C.textoMudo }}>Projetos</a>
        </div>
      </div>

      {/* Content */}
      <div className="page-pad" style={{ maxWidth: '960px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* 4 contadores */}
        <div className="grid-4" style={{ marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 8px' }}>Total de projetos</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: C.texto, margin: '0 0 4px' }}>{contadores.totalProjetos}</p>
            <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>projetos cadastrados</p>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.ambar}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 8px' }}>Tarefas pendentes</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: C.ambar, margin: '0 0 4px' }}>{contadores.pendentes}</p>
            <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>aguardando inicio</p>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 8px' }}>Em andamento</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: C.royal, margin: '0 0 4px' }}>{contadores.emAndamento}</p>
            <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>em execucao</p>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.verde}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 8px' }}>Concluidas</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: C.verde, margin: '0 0 4px' }}>{contadores.concluidas}</p>
            <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>{taxaConclusao}% de conclusao</p>
          </div>
        </div>

        {/* Projetos + Tarefas */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>

          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Projetos recentes</h2>
            {projetosRecentes.length === 0 && (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum projeto ainda</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projetosRecentes.map(p => {
                const cor = corStatus(p.status)
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${C.fundo}` }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: C.texto }}>{p.titulo}</p>
                      <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>{p.responsavel || 'Sem responsavel'} • {formatarData(p.criado_em)}</p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: cor.bg, color: cor.text, whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      {labelStatus(p.status)}
                    </span>
                  </div>
                )
              })}
            </div>
            <a href="/projetos" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px', color: C.royal, textDecoration: 'none', fontWeight: 'bold' }}>
              Ver todos os projetos →
            </a>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.ambar}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Tarefas com prazo proximo</h2>
            {tarefasProximas.length === 0 && (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma tarefa com prazo proximo</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tarefasProximas.map(t => {
                const prazo = corPrazo(t.data_entrega)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.fundo}` }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: prazo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px' }}>📅</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: C.texto }}>{t.titulo}</p>
                      <p style={{ fontSize: '12px', color: prazo.icon, margin: 0 }}>{prazo.texto} {t.responsavel ? '• ' + t.responsavel : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Relatorios recentes */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Relatorios recentes</h2>
          {entrevistasRecentes.length === 0 && (
            <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum relatorio ainda</p>
          )}
          <div className="grid-3">
            {entrevistasRecentes.map(e => (
              <div key={e.id} style={{ border: `1px solid ${C.borda}`, borderRadius: '6px', padding: '16px', background: C.fundo }}>
                <p style={{ fontSize: '20px', margin: '0 0 8px' }}>📋</p>
                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px', color: C.texto }}>{e.processo}</p>
                <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>{e.responsavel} • {diasAtras(e.criado_em)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
