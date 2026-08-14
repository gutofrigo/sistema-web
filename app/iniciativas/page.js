'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, User, ArrowRight } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C, estiloCard } from '../theme'

const COLUNAS = [
  { id: 'backlog', label: 'Backlog', cor: C.textoMudo },
  { id: 'em_analise', label: 'Em analise', cor: C.statusInfo },
  { id: 'em_andamento', label: 'Em andamento', cor: C.ambar },
  { id: 'concluido', label: 'Concluido', cor: C.verde },
]

const CATEGORIAS = [
  { id: 'ti', label: 'TI / Tecnologia', cor: C.royal },
  { id: 'processos', label: 'Processos / Melhoria', cor: C.roxo },
  { id: 'rh', label: 'RH / Pessoas', cor: '#0891B2' },
  { id: 'financeiro', label: 'Financeiro / Operacoes', cor: '#EA580C' },
  { id: 'outros', label: 'Outros', cor: C.textoMudo },
]

function corCategoria(id) {
  return (CATEGORIAS.find(c => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1]).cor
}
function labelCategoria(id) {
  return (CATEGORIAS.find(c => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1]).label
}
function corPrioridade(n) {
  if (n >= 8) return C.vermelho
  if (n >= 4) return C.ambar
  return C.verde
}

const formInicial = { titulo: '', descricao: '', categoria: 'outros', prioridade: 5, solicitante: '', responsavel: '' }

export default function Iniciativas() {
  const [iniciativas, setIniciativas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [novaIniciativa, setNovaIniciativa] = useState(formInicial)
  const [salvando, setSalvando] = useState(false)
  const [arrastando, setArrastando] = useState(null)
  const [promovendo, setPromovendo] = useState(null)

  useEffect(() => { buscarIniciativas() }, [])

  async function buscarIniciativas() {
    setCarregando(true)
    const res = await fetch('/api/iniciativas')
    const data = await res.json()
    if (data.iniciativas) setIniciativas(data.iniciativas)
    else if (data.erro) alert('Erro ao carregar iniciativas: ' + data.erro)
    setCarregando(false)
  }

  async function criarIniciativa() {
    if (!novaIniciativa.titulo.trim()) return alert('Digite o titulo da iniciativa')
    setSalvando(true)
    const res = await fetch('/api/iniciativas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novaIniciativa) })
    const data = await res.json()
    setSalvando(false)
    if (data.erro) return alert('Erro ao criar iniciativa: ' + data.erro)
    setNovaIniciativa(formInicial)
    setMostrarForm(false)
    buscarIniciativas()
  }

  async function atualizarIniciativa(id, campos) {
    const res = await fetch('/api/iniciativas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...campos }) })
    const data = await res.json()
    if (data.erro) alert('Erro ao atualizar iniciativa: ' + data.erro)
    buscarIniciativas()
  }

  async function deletarIniciativa(id) {
    if (!confirm('Deletar esta iniciativa?')) return
    const res = await fetch('/api/iniciativas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await res.json()
    if (data.erro) alert('Erro ao deletar iniciativa: ' + data.erro)
    buscarIniciativas()
  }

  async function promoverIniciativa(id) {
    if (!confirm('Promover esta iniciativa a um projeto completo?')) return
    setPromovendo(id)
    const res = await fetch('/api/iniciativas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promover: true, id }) })
    const data = await res.json()
    setPromovendo(null)
    if (data.projeto) window.location.href = '/projetos?id=' + data.projeto.id
    else alert('Erro ao promover: ' + (data.erro || 'desconhecido'))
  }

  function onDragStart(e, id) {
    e.dataTransfer.setData('text/plain', id)
    setArrastando(id)
  }
  function onDrop(e, statusColuna) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const item = iniciativas.find(i => i.id === id)
    setArrastando(null)
    if (item && item.status !== statusColuna) atualizarIniciativa(id, { status: statusColuna })
  }

  const inputStyle = { width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: C.texto }

  return (
    <AppShell
      title="Iniciativas"
      subtitle="Backlog de demandas e projetos"
      actions={
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Nova iniciativa
        </button>
      }
    >
      <div className="page-pad" style={{ width: '100%', boxSizing: 'border-box' }}>

        {mostrarForm && (
          <div style={{ ...estiloCard, padding: '24px', marginBottom: '20px', borderLeft: `3px solid ${C.royal}`, maxWidth: '640px' }}>
            <h3 style={{ margin: '0 0 16px', color: C.texto, fontSize: '15px', fontWeight: 700 }}>Nova iniciativa</h3>
            <input placeholder="Titulo da iniciativa" value={novaIniciativa.titulo} onChange={e => setNovaIniciativa({ ...novaIniciativa, titulo: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }} />
            <textarea placeholder="Descricao (opcional)" value={novaIniciativa.descricao} onChange={e => setNovaIniciativa({ ...novaIniciativa, descricao: e.target.value })} rows={2}
              style={{ ...inputStyle, marginBottom: '10px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Categoria</label>
                <select value={novaIniciativa.categoria} onChange={e => setNovaIniciativa({ ...novaIniciativa, categoria: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                  {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Prioridade (1-10)</label>
                <input type="number" min="1" max="10" value={novaIniciativa.prioridade}
                  onChange={e => setNovaIniciativa({ ...novaIniciativa, prioridade: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input placeholder="Solicitante (quem pediu)" value={novaIniciativa.solicitante} onChange={e => setNovaIniciativa({ ...novaIniciativa, solicitante: e.target.value })}
                style={{ ...inputStyle, flex: 1, minWidth: '160px' }} />
              <input placeholder="Responsavel (opcional)" value={novaIniciativa.responsavel} onChange={e => setNovaIniciativa({ ...novaIniciativa, responsavel: e.target.value })}
                style={{ ...inputStyle, flex: 1, minWidth: '160px' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setMostrarForm(false); setNovaIniciativa(formInicial) }} style={{ flex: 1, padding: '10px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={criarIniciativa} disabled={salvando} className="btn-hover" style={{ flex: 2, padding: '10px', background: salvando ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '8px', cursor: salvando ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700 }}>
                {salvando ? 'Salvando...' : 'Criar iniciativa'}
              </button>
            </div>
          </div>
        )}

        {carregando ? (
          <p style={{ color: C.textoSec, fontSize: '14px' }}>Carregando quadro...</p>
        ) : (
          <div style={{ ...estiloCard, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', overflowX: 'auto', alignItems: 'stretch' }}>
              {COLUNAS.map((coluna, idx) => {
                const itens = iniciativas.filter(i => i.status === coluna.id).sort((a, b) => b.prioridade - a.prioridade)
                return (
                  <div key={coluna.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onDrop(e, coluna.id)}
                    style={{ background: C.fundo, borderRight: idx < COLUNAS.length - 1 ? `1px solid ${C.borda}` : 'none', padding: '16px', width: '290px', flexShrink: 0, minHeight: '420px', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', paddingBottom: '12px', borderBottom: `2px solid ${coluna.cor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: C.texto, display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: coluna.cor, display: 'inline-block' }} />
                          {coluna.label}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textoSec, background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '20px', padding: '2px 9px' }}>{itens.length}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {itens.map(item => (
                      <div key={item.id}
                        draggable
                        onDragStart={e => onDragStart(e, item.id)}
                        className="card-elevate"
                        style={{ background: C.branco, border: `1px solid #E7ECF3`, borderLeft: `4px solid ${corPrioridade(item.prioridade)}`, borderRadius: '10px', padding: '12px', cursor: 'grab', opacity: arrastando === item.id ? 0.5 : 1, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: C.texto }}>{item.titulo}</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', background: corCategoria(item.categoria), padding: '2px 8px', borderRadius: '20px' }}>{labelCategoria(item.categoria)}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: corPrioridade(item.prioridade), background: C.fundo, border: `1px solid ${corPrioridade(item.prioridade)}`, padding: '2px 8px', borderRadius: '20px' }}>P{item.prioridade}</span>
                        </div>
                        {item.solicitante && (
                          <p style={{ margin: '0 0 8px', fontSize: '11px', color: C.textoMudo, display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} /> {item.solicitante}</p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${C.fundo}` }}>
                          {item.projeto_id ? (
                            <a href={'/projetos?id=' + item.projeto_id} style={{ fontSize: '11px', color: C.royal, fontWeight: 700, textDecoration: 'none' }}>Ver projeto →</a>
                          ) : (
                            <button onClick={() => promoverIniciativa(item.id)} disabled={promovendo === item.id} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: C.royal, fontWeight: 700, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              {promovendo === item.id ? 'Promovendo...' : <>Promover <ArrowRight size={11} /></>}
                            </button>
                          )}
                          <button onClick={() => deletarIniciativa(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '2px' }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                    {itens.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 8px', color: C.textoMudo, fontSize: '12px', border: `1px dashed ${C.borda}`, borderRadius: '8px' }}>
                        Arraste um card aqui
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
