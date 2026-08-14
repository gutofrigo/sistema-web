'use client'
import { useState, useEffect } from 'react'
import { FolderKanban } from 'lucide-react'
import AppShell from '../components/AppShell'
import { GanttChart, fmt, parseData } from '../components/GanttChart'
import { theme as C } from '../theme'

const CORES_STATUS = { concluido: C.verde, em_andamento: C.statusInfo, pendente: C.ambar }
const CORES_PROJETO = ['#1E5BC6','#16A34A','#F59E0B','#DC2626','#7C3AED','#0891B2']

export default function Gantt() {
  const [modo, setModo] = useState('programa')
  const [projetos, setProjetos] = useState([])
  const [tarefas, setTarefas] = useState([])
  const [projetoSelecionado, setProjetoSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    setCarregando(true)
    const res = await fetch('/api/gantt')
    const data = await res.json()
    setProjetos(data.projetos || [])
    setTarefas(data.tarefas || [])
    setCarregando(false)
  }

  function tarefasDoProjeto(projetoId) {
    return tarefas.filter(t => t.projeto_id === projetoId && t.data_entrega)
  }

  function projetoComDatas() {
    return projetos.map((p, idx) => {
      const ts = tarefasDoProjeto(p.id)
      const datas = ts.map(t => parseData(t.data_entrega)).filter(Boolean)
      const inicios = ts.map(t => parseData(t.data_inicio)).filter(Boolean)
      const inicio = inicios.length > 0 ? new Date(Math.min(...inicios)) : (datas.length > 0 ? new Date(Math.min(...datas)) : null)
      const fim = datas.length > 0 ? new Date(Math.max(...datas)) : null
      const concluidas = ts.filter(t => t.status === 'concluido').length
      const pct = ts.length > 0 ? Math.round((concluidas / ts.length) * 100) : 0
      return { ...p, inicio, fim, pct, cor: CORES_PROJETO[idx % CORES_PROJETO.length], tarefasCount: ts.length }
    }).filter(p => p.inicio && p.fim)
  }

  if (carregando) return (
    <AppShell title="Gantt" subtitle="Sistema de Melhoria">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textoSec }}>Carregando...</p>
      </div>
    </AppShell>
  )

  const projetosComDatas = projetoComDatas()
  const projetoAtual = projetoSelecionado ? projetos.find(p => p.id === projetoSelecionado) : null
  const tarefasAtuais = projetoSelecionado ? tarefasDoProjeto(projetoSelecionado).map(t => ({
    ...t,
    inicio: parseData(t.data_inicio) || parseData(t.data_entrega),
    fim: parseData(t.data_entrega)
  })).filter(t => t.fim) : []

  return (
    <AppShell
      title="Gantt"
      subtitle="Sistema de Melhoria"
      actions={
        <a href="/projetos" className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.branco, border: `1px solid ${C.borda}`, color: C.texto, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          <FolderKanban size={14} /> Projetos
        </a>
      }
    >
      {/* Content */}
      <div className="page-pad" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => { setModo('programa'); setProjetoSelecionado(null) }} style={{ padding: '8px 16px', background: modo === 'programa' ? C.navy : 'white', color: modo === 'programa' ? 'white' : C.textoSec, border: `1px solid ${modo === 'programa' ? C.navy : C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: modo === 'programa' ? 'bold' : 'normal' }}>
            Visao de programa
          </button>
          <button onClick={() => setModo('projeto')} style={{ padding: '8px 16px', background: modo === 'projeto' ? C.navy : 'white', color: modo === 'projeto' ? 'white' : C.textoSec, border: `1px solid ${modo === 'projeto' ? C.navy : C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: modo === 'projeto' ? 'bold' : 'normal' }}>
            Projeto individual
          </button>
        </div>

        {modo === 'programa' && (
          <div style={{ background: C.branco, borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: C.texto, margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Todos os projetos</h2>
              <span style={{ fontSize: '12px', background: '#EEF2FF', color: C.royal, padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{projetosComDatas.length} projetos com datas</span>
            </div>
            {projetosComDatas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: C.textoMudo, fontSize: '14px' }}>
                Nenhum projeto com tarefas com datas definidas
              </div>
            ) : (
              <GanttChart
                itens={projetosComDatas}
                colunaLabel="Projeto"
                getCor={(item) => item.cor}
                getLabel={(item) => item.pct + '% • ate ' + fmt(item.fim)}
                getSubLabel={(item) => (item.responsavel || 'Sem responsavel') + ' • ' + item.tarefasCount + ' tarefa(s)'}
                colNome={180}
              />
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '2px', height: '12px', background: C.vermelho }}></div>
                <span style={{ fontSize: '11px', color: C.textoSec }}>Hoje</span>
              </div>
            </div>
          </div>
        )}

        {modo === 'projeto' && (
          <div>
            <div style={{ background: C.branco, borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '13px', color: C.textoSec, margin: '0 0 10px' }}>Selecione um projeto:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {projetos.map(p => (
                  <button key={p.id} onClick={() => setProjetoSelecionado(p.id)} style={{ padding: '8px 16px', background: projetoSelecionado === p.id ? C.navy : C.fundo, color: projetoSelecionado === p.id ? 'white' : C.textoSec, border: `1px solid ${projetoSelecionado === p.id ? C.navy : C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: projetoSelecionado === p.id ? 'bold' : 'normal' }}>
                    {p.titulo}
                  </button>
                ))}
              </div>
            </div>

            {projetoAtual && (
              <div style={{ background: C.branco, borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ color: C.texto, margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{projetoAtual.titulo}</h2>
                  <span style={{ fontSize: '12px', color: C.textoSec }}>{tarefasAtuais.length} tarefa(s) com data</span>
                </div>
                {tarefasAtuais.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: C.textoMudo, fontSize: '14px' }}>
                    Nenhuma tarefa com data de entrega definida
                  </div>
                ) : (
                  <GanttChart
                    itens={tarefasAtuais}
                    colunaLabel="Tarefa"
                    getCor={(item) => CORES_STATUS[item.status] || C.textoMudo}
                    getLabel={(item) => item.responsavel || fmt(item.fim)}
                    getSubLabel={(item) => item.status + ' • ate ' + fmt(item.fim)}
                    colNome={160}
                  />
                )}
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {['concluido','em_andamento','pendente'].map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: CORES_STATUS[s] }}></div>
                      <span style={{ fontSize: '11px', color: C.textoSec }}>{s.replace('_',' ')}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '2px', height: '12px', background: C.vermelho }}></div>
                    <span style={{ fontSize: '11px', color: C.textoSec }}>Hoje</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  )
}
