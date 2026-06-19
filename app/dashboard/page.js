'use client'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {
    setCarregando(true)
    const res = await fetch('/api/dashboard')
    const data = await res.json()
    setDados(data)
    setCarregando(false)
  }

  function corStatus(status) {
    if (status === 'concluido') return { bg: '#ecfdf5', text: '#065f46' }
    if (status === 'em_andamento') return { bg: '#eff6ff', text: '#1e40af' }
    return { bg: '#fffbeb', text: '#92400e' }
  }

  function labelStatus(status) {
    if (status === 'concluido') return 'Concluido'
    if (status === 'em_andamento') return 'Em andamento'
    return 'Pendente'
  }

  function corPrazo(dataEntrega) {
    if (!dataEntrega) return { bg: '#f4f5f7', icon: '#8fa3b1', texto: 'Sem prazo' }
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const entrega = new Date(dataEntrega + 'T12:00:00')
    const diff = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { bg: '#fef2f2', icon: '#dc2626', texto: 'Venceu ' + Math.abs(diff) + ' dia(s) atras' }
    if (diff === 0) return { bg: '#fffbeb', icon: '#d97706', texto: 'Vence hoje' }
    return { bg: '#f4f5f7', icon: '#5a6a7a', texto: 'Vence em ' + diff + ' dia(s)' }
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

  if (carregando) {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#5a6a7a', fontSize: '15px' }}>Carregando dashboard...</p>
      </div>
    )
  }

  if (!dados || dados.erro) {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#dc2626' }}>Erro ao carregar dados</p>
      </div>
    )
  }

  const { contadores, projetosRecentes, tarefasProximas, entrevistasRecentes } = dados
  const totalTarefas = contadores.pendentes + contadores.emAndamento + contadores.concluidas
  const taxaConclusao = totalTarefas > 0 ? Math.round((contadores.concluidas / totalTarefas) * 100) : 0

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', padding: '40px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <p style={{ color: '#5a6a7a', margin: '0 0 4px', fontSize: '13px' }}>Sistema de Melhoria</p>
            <h1 style={{ color: '#1c2b3a', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', textDecoration: 'none', color: '#2e4a63', fontSize: '13px', fontWeight: 'bold' }}>
              ← Voltar para Inicio
            </a>
            <a href="/projetos" style={{ padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', textDecoration: 'none', color: '#5a6a7a', fontSize: '13px' }}>
              Projetos
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63' }}>
            <p style={{ color: '#5a6a7a', fontSize: '12px', margin: '0 0 8px' }}>Total de projetos</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1c2b3a', margin: '0 0 4px' }}>{contadores.totalProjetos}</p>
            <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>projetos cadastrados</p>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #d6dbe0', borderLeft: '3px solid #d97706' }}>
            <p style={{ color: '#5a6a7a', fontSize: '12px', margin: '0 0 8px' }}>Tarefas pendentes</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#d97706', margin: '0 0 4px' }}>{contadores.pendentes}</p>
            <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>aguardando inicio</p>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2563eb' }}>
            <p style={{ color: '#5a6a7a', fontSize: '12px', margin: '0 0 8px' }}>Em andamento</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb', margin: '0 0 4px' }}>{contadores.emAndamento}</p>
            <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>em execucao</p>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #d6dbe0', borderLeft: '3px solid #16a34a' }}>
            <p style={{ color: '#5a6a7a', fontSize: '12px', margin: '0 0 8px' }}>Concluidas</p>
            <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#16a34a', margin: '0 0 4px' }}>{contadores.concluidas}</p>
            <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>{taxaConclusao}% de conclusao</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1c2b3a', margin: '0 0 16px' }}>Projetos recentes</h2>
            {projetosRecentes.length === 0 && (
              <p style={{ color: '#8fa3b1', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum projeto ainda</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projetosRecentes.map(p => {
                const cor = corStatus(p.status)
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f4f5f7' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: '#1c2b3a' }}>{p.titulo}</p>
                      <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>{p.responsavel || 'Sem responsavel'} • {formatarData(p.criado_em)}</p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: cor.bg, color: cor.text, whiteSpace: 'nowrap' }}>
                      {labelStatus(p.status)}
                    </span>
                  </div>
                )
              })}
            </div>
            <a href="/projetos" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#2e4a63', textDecoration: 'none', fontWeight: 'bold' }}>
              Ver todos os projetos →
            </a>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1c2b3a', margin: '0 0 16px' }}>Tarefas com prazo proximo</h2>
            {tarefasProximas.length === 0 && (
              <p style={{ color: '#8fa3b1', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma tarefa com prazo proximo</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tarefasProximas.map(t => {
                const prazo = corPrazo(t.data_entrega)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f4f5f7' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: prazo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px' }}>📅</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: '#1c2b3a' }}>{t.titulo}</p>
                      <p style={{ fontSize: '12px', color: prazo.icon, margin: 0 }}>{prazo.texto} {t.responsavel ? '• ' + t.responsavel : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1c2b3a', margin: '0 0 16px' }}>Relatorios recentes</h2>
          {entrevistasRecentes.length === 0 && (
            <p style={{ color: '#8fa3b1', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum relatorio ainda</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {entrevistasRecentes.map(e => (
              <div key={e.id} style={{ border: '1px solid #d6dbe0', borderRadius: '6px', padding: '16px', background: '#f4f5f7' }}>
                <p style={{ fontSize: '20px', margin: '0 0 8px' }}>📋</p>
                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px', color: '#1c2b3a' }}>{e.processo}</p>
                <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>{e.responsavel} • {diasAtras(e.criado_em)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
