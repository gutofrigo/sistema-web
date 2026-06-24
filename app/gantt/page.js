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

const NOMES_MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const CORES_STATUS = { concluido: C.verde, em_andamento: C.royal, pendente: C.ambar }
const CORES_PROJETO = ['#1E5BC6','#16A34A','#F59E0B','#DC2626','#7C3AED','#0891B2']

function fmt(d) {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.getDate().toString().padStart(2,'0') + '/' + (dt.getMonth()+1).toString().padStart(2,'0')
}
function parseData(s) {
  if (!s) return null
  return new Date(s + 'T12:00:00')
}

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

  function GanttTabela({ itens, colunaLabel, getCor, getLabel, getSubLabel, colNome }) {
    const hoje = new Date()
    hoje.setHours(12,0,0,0)
    const datas = itens.flatMap(i => [i.inicio, i.fim]).filter(Boolean)
    if (datas.length === 0) return (
      <div style={{ textAlign: 'center', padding: '40px', color: C.textoMudo, fontSize: '14px' }}>
        Nenhuma tarefa com data definida
      </div>
    )
    const minDate = new Date(Math.min(...datas))
    const maxDate = new Date(Math.max(...datas))
    minDate.setDate(minDate.getDate() - 2)
    maxDate.setDate(maxDate.getDate() + 3)
    const totalDias = Math.ceil((maxDate - minDate) / 86400000)
    const dias = []
    for (let i = 0; i <= totalDias; i++) {
      const d = new Date(minDate)
      d.setDate(minDate.getDate() + i)
      dias.push(d)
    }
    const colW = Math.max(Math.floor(480 / totalDias), 12)
    const nomesCol = colNome || 160
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: nomesCol + dias.length * colW + 'px' }}>
          <div style={{ display: 'flex', borderBottom: `1.5px solid ${C.borda}`, marginBottom: '4px' }}>
            <div style={{ width: nomesCol + 'px', flexShrink: 0, fontSize: '12px', color: C.textoSec, paddingBottom: '4px' }}>{colunaLabel}</div>
            <div style={{ display: 'flex' }}>
              {dias.map((d, i) => {
                const isHoje = d.toDateString() === hoje.toDateString()
                const prevMes = i > 0 ? dias[i-1].getMonth() : -1
                return (
                  <div key={i} style={{ width: colW + 'px', textAlign: 'center', fontSize: '10px', color: isHoje ? C.vermelho : C.textoMudo, background: isHoje ? '#fef2f2' : '', borderLeft: isHoje ? `1.5px solid ${C.vermelho}` : `0.5px solid ${C.fundo}`, padding: '2px 0', boxSizing: 'border-box' }}>
                    {d.getMonth() !== prevMes && <span style={{ fontWeight: 'bold', color: isHoje ? C.vermelho : C.royal, display: 'block', fontSize: '10px' }}>{NOMES_MES[d.getMonth()]}</span>}
                    {d.getDate()}
                  </div>
                )
              })}
            </div>
          </div>
          {itens.map((item, idx) => {
            if (!item.inicio || !item.fim) return null
            const startOffset = Math.max(0, Math.ceil((item.inicio - minDate) / 86400000))
            const duracao = Math.max(1, Math.ceil((item.fim - item.inicio) / 86400000))
            const cor = getCor(item, idx)
            const label = getLabel(item)
            const sub = getSubLabel(item)
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: `0.5px solid ${C.fundo}` }}>
                <div style={{ width: nomesCol + 'px', flexShrink: 0, paddingRight: '12px' }}>
                  <p style={{ fontSize: '13px', margin: '0 0 1px', color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titulo}</p>
                  <p style={{ fontSize: '11px', color: C.textoMudo, margin: 0 }}>{sub}</p>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ display: 'flex' }}>
                    {dias.map((d, i) => {
                      const isHoje = d.toDateString() === hoje.toDateString()
                      return <div key={i} style={{ width: colW + 'px', height: '28px', borderLeft: isHoje ? `1.5px solid ${C.vermelho}` : `0.5px solid ${C.fundo}`, background: isHoje ? '#fff8f8' : '', boxSizing: 'border-box', flexShrink: 0 }}></div>
                    })}
                  </div>
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: (startOffset * colW) + 'px', width: (duracao * colW) + 'px', height: '20px', background: cor, borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 8px', boxSizing: 'border-box', zIndex: 1, minWidth: '20px' }}>
                    <span style={{ fontSize: '10px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }

  if (carregando) return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.textoSec }}>Carregando...</p>
    </div>
  )

  const projetosComDatas = projetoComDatas()
  const projetoAtual = projetoSelecionado ? projetos.find(p => p.id === projetoSelecionado) : null
  const tarefasAtuais = projetoSelecionado ? tarefasDoProjeto(projetoSelecionado).map(t => ({
    ...t,
    inicio: parseData(t.data_inicio) || parseData(t.data_entrega),
    fim: parseData(t.data_entrega)
  })).filter(t => t.fim) : []

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: C.navy, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 2px' }}>Sistema de Melhoria</p>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Gantt</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/" style={btnHeader}>← Inicio</a>
          <a href="/projetos" style={{ ...btnHeader, background: 'transparent', fontWeight: 'normal', color: C.textoMudo }}>Projetos</a>
        </div>
      </div>

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
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: C.texto, margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Todos os projetos</h2>
              <span style={{ fontSize: '12px', background: '#EEF2FF', color: C.royal, padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{projetosComDatas.length} projetos com datas</span>
            </div>
            {projetosComDatas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: C.textoMudo, fontSize: '14px' }}>
                Nenhum projeto com tarefas com datas definidas
              </div>
            ) : (
              <GanttTabela
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
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
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
              <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ color: C.texto, margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{projetoAtual.titulo}</h2>
                  <span style={{ fontSize: '12px', color: C.textoSec }}>{tarefasAtuais.length} tarefa(s) com data</span>
                </div>
                {tarefasAtuais.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: C.textoMudo, fontSize: '14px' }}>
                    Nenhuma tarefa com data de entrega definida
                  </div>
                ) : (
                  <GanttTabela
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
    </div>
  )
}
