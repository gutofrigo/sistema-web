'use client'
import { useState, useEffect } from 'react'

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

const coresStatus = { pendente: C.ambar, em_andamento: C.royal, concluido: C.verde }

export default function Projetos() {
  const [tela, setTela] = useState('lista')
  const [projetos, setProjetos] = useState([])
  const [projetoAtivo, setProjetoAtivo] = useState(null)
  const [tarefas, setTarefas] = useState([])
  const [novoProj, setNovoProj] = useState({ titulo: '', responsavel: '', descricao: '' })
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', responsavel: '', data_inicio: '', data_entrega: '', status: 'pendente', tarefa_pai_id: '' })
  const [mostrarFormTarefa, setMostrarFormTarefa] = useState(false)
  const [mostrarGerador, setMostrarGerador] = useState(false)
  const [objetivoIA, setObjetivoIA] = useState('')
  const [gerandoIA, setGerandoIA] = useState(false)
  const [tarefasIA, setTarefasIA] = useState([])
  const [selecionadas, setSelecionadas] = useState([])
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => { buscarProjetos() }, [])

  async function buscarProjetos() {
    const res = await fetch('/api/projetos')
    const data = await res.json()
    if (data.projetos) setProjetos(data.projetos)
  }
  async function buscarTarefas(projetoId) {
    const res = await fetch('/api/tarefas?projeto_id=' + projetoId)
    const data = await res.json()
    if (data.tarefas) setTarefas(data.tarefas)
  }
  async function criarProjeto() {
    if (!novoProj.titulo) return alert('Digite o titulo do projeto')
    await fetch('/api/projetos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoProj) })
    setNovoProj({ titulo: '', responsavel: '', descricao: '' })
    setTela('lista')
    buscarProjetos()
  }
  async function deletarProjeto(e, id) {
    e.stopPropagation()
    if (!confirm('Deletar este projeto e todas as suas tarefas?')) return
    await fetch('/api/projetos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarProjetos()
  }
  async function deletarTarefa(id) {
    if (!confirm('Deletar esta tarefa?')) return
    await fetch('/api/tarefas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarTarefas(projetoAtivo.id)
  }
  async function abrirProjeto(projeto) {
    setProjetoAtivo(projeto)
    await buscarTarefas(projeto.id)
    setTela('projeto')
  }
  async function criarTarefa() {
    if (!novaTarefa.titulo) return alert('Digite o titulo da tarefa')
    await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...novaTarefa, projeto_id: projetoAtivo.id }) })
    setNovaTarefa({ titulo: '', responsavel: '', data_inicio: '', data_entrega: '', status: 'pendente', tarefa_pai_id: '' })
    setMostrarFormTarefa(false)
    buscarTarefas(projetoAtivo.id)
  }
  async function mudarStatusTarefa(id, status) {
    await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    buscarTarefas(projetoAtivo.id)
  }
  async function gerarTarefasIA() {
    if (!objetivoIA.trim()) return alert('Descreva o objetivo')
    setGerandoIA(true)
    setTarefasIA([])
    const res = await fetch('/api/gerar-tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objetivo: objetivoIA, projeto: projetoAtivo.titulo }) })
    const data = await res.json()
    if (data.erro) { alert('Erro: ' + data.erro) } else {
      setTarefasIA(data.tarefas || [])
      setSelecionadas((data.tarefas || []).map((_, i) => i))
    }
    setGerandoIA(false)
  }
  async function adicionarTarefasSelecionadas() {
    setAdicionando(true)
    const hoje = new Date()
    for (const idx of selecionadas) {
      const t = tarefasIA[idx]
      const dataEntrega = new Date(hoje)
      dataEntrega.setDate(hoje.getDate() + (t.prazo_dias || 7))
      await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: t.titulo, responsavel: t.responsavel || '', data_entrega: dataEntrega.toISOString().split('T')[0], status: 'pendente', projeto_id: projetoAtivo.id }) })
    }
    setAdicionando(false)
    setMostrarGerador(false)
    setObjetivoIA('')
    setTarefasIA([])
    setSelecionadas([])
    buscarTarefas(projetoAtivo.id)
  }
  function toggleSelecionada(idx) {
    if (selecionadas.includes(idx)) setSelecionadas(selecionadas.filter(i => i !== idx))
    else setSelecionadas([...selecionadas, idx])
  }
  function corPrioridade(p) {
    if (p === 'alta') return { bg: '#FEF2F2', color: C.vermelho }
    if (p === 'baixa') return { bg: '#F0FDF4', color: C.verde }
    return { bg: '#EEF2FF', color: C.royal }
  }

  const tarefasPai = tarefas.filter(t => !t.tarefa_pai_id)
  const tarefasFilho = (paiId) => tarefas.filter(t => t.tarefa_pai_id === paiId)

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', cursor: 'pointer' }
  const inputStyle = { width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', color: C.texto }

  // ── TELA: Lista ─────────────────────────────────────────────────────────────
  if (tela === 'lista') return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.navy, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 2px' }}>Sistema de Melhoria</p>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Projetos</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/" style={btnHeader}>← Inicio</a>
          <a href="/gantt" style={{ ...btnHeader, background: 'transparent', fontWeight: 'normal', color: C.textoMudo }}>📊 Gantt</a>
          <button onClick={() => setTela('novo')} style={{ ...btnHeader, background: C.royal, border: 'none' }}>+ Novo Projeto</button>
        </div>
      </div>

      <div className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {projetos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '17px' }}>Nenhum projeto ainda</p>
            <p style={{ fontSize: '14px' }}>Crie um projeto ou faca uma entrevista de processo</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projetos.map(p => (
            <div key={p.id} onClick={() => abrirProjeto(p)} style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `4px solid ${coresStatus[p.status] || C.royal}`, borderRadius: '8px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: C.texto, fontSize: '15px' }}>{p.titulo}</h3>
                  <p style={{ margin: 0, color: C.textoMudo, fontSize: '13px' }}>{p.responsavel || 'Sem responsavel'} • {new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: coresStatus[p.status] || C.royal, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{p.status}</span>
                  <button onClick={e => deletarProjeto(e, p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: C.textoMudo, padding: '4px' }} title="Deletar projeto">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── TELA: Novo Projeto ───────────────────────────────────────────────────────
  if (tela === 'novo') return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.navy, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 2px' }}>Projetos</p>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Novo Projeto</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setTela('lista')} style={btnHeader}>← Voltar</button>
          <a href="/" style={{ ...btnHeader, background: 'transparent', fontWeight: 'normal', color: C.textoMudo }}>Inicio</a>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '36px', width: '100%', maxWidth: '600px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <input placeholder="Titulo do projeto" value={novoProj.titulo} onChange={e => setNovoProj({ ...novoProj, titulo: e.target.value })}
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <input placeholder="Responsavel" value={novoProj.responsavel} onChange={e => setNovoProj({ ...novoProj, responsavel: e.target.value })}
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <textarea placeholder="Descricao (opcional)" value={novoProj.descricao} onChange={e => setNovoProj({ ...novoProj, descricao: e.target.value })} rows={3}
            style={{ ...inputStyle, marginBottom: '20px', resize: 'vertical' }} />
          <button onClick={criarProjeto} style={{ width: '100%', padding: '13px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            Criar Projeto
          </button>
        </div>
      </div>
    </div>
  )

  // ── TELA: Projeto (tarefas) ──────────────────────────────────────────────────
  if (tela === 'projeto') return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: C.fundo, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.navy, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 2px' }}>{projetoAtivo.responsavel || 'Projetos'}</p>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{projetoAtivo.titulo}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setTela('lista')} style={btnHeader}>← Projetos</button>
          <a href="/" style={{ ...btnHeader, background: 'transparent', fontWeight: 'normal', color: C.textoMudo }}>Inicio</a>
          <a href="/gantt" style={{ ...btnHeader, background: 'transparent', fontWeight: 'normal', color: C.textoMudo }}>📊 Gantt</a>
          <button onClick={() => { setMostrarGerador(!mostrarGerador); setMostrarFormTarefa(false) }} style={{ ...btnHeader, background: 'rgba(255,255,255,0.18)' }}>✨ Gerar com IA</button>
          <button onClick={() => { setMostrarFormTarefa(!mostrarFormTarefa); setMostrarGerador(false) }} style={{ ...btnHeader, background: C.royal, border: 'none' }}>+ Nova Tarefa</button>
        </div>
      </div>

      <div className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Gerador IA */}
        {mostrarGerador && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: C.texto, fontSize: '15px', fontWeight: 'bold' }}>✨ Gerar tarefas com IA</h3>
            <p style={{ color: C.textoSec, fontSize: '13px', margin: '0 0 14px' }}>Descreva o objetivo e a IA cria as tarefas automaticamente</p>
            <textarea
              placeholder="Ex: Precisamos migrar 3 servidores para AWS, incluindo testes de carga e treinamento da equipe..."
              value={objetivoIA}
              onChange={e => setObjetivoIA(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', color: C.texto }}
            />
            <button onClick={gerarTarefasIA} disabled={gerandoIA} style={{ padding: '9px 20px', background: gerandoIA ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: gerandoIA ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {gerandoIA ? 'Gerando...' : '✨ Gerar tarefas'}
            </button>
            {tarefasIA.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 'bold', color: C.texto, margin: 0, fontSize: '14px' }}>Tarefas sugeridas</p>
                  <span style={{ fontSize: '12px', background: '#F0FDF4', color: C.verde, padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{tarefasIA.length} tarefas geradas</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {tarefasIA.map((t, idx) => {
                    const cp = corPrioridade(t.prioridade)
                    return (
                      <div key={idx} onClick={() => toggleSelecionada(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: selecionadas.includes(idx) ? '#EEF2FF' : C.fundo, border: `1px solid ${selecionadas.includes(idx) ? C.royal : C.borda}`, borderRadius: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selecionadas.includes(idx)} onChange={() => toggleSelecionada(idx)} style={{ width: '16px', height: '16px', accentColor: C.royal, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px', color: C.texto }}>{t.titulo}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: C.textoMudo }}>
                            {t.responsavel && <span>👤 {t.responsavel}</span>}
                            {t.prazo_dias && <span>📅 {t.prazo_dias} dias</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', background: cp.bg, color: cp.color, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{t.prioridade}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => { setTarefasIA([]); setObjetivoIA('') }} style={{ padding: '9px 16px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                  <button onClick={adicionarTarefasSelecionadas} disabled={adicionando || selecionadas.length === 0} style={{ padding: '9px 20px', background: adicionando ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: adicionando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    {adicionando ? 'Adicionando...' : 'Adicionar ' + selecionadas.length + ' tarefa(s) ao projeto'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form nova tarefa */}
        {mostrarFormTarefa && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: C.texto, fontSize: '15px', fontWeight: 'bold' }}>Nova Tarefa</h3>
            <input placeholder="Titulo da tarefa" value={novaTarefa.titulo} onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="Responsavel" value={novaTarefa.responsavel} onChange={e => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Data inicio</label>
                <input type="date" value={novaTarefa.data_inicio} onChange={e => setNovaTarefa({ ...novaTarefa, data_inicio: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Data entrega</label>
                <input type="date" value={novaTarefa.data_entrega} onChange={e => setNovaTarefa({ ...novaTarefa, data_entrega: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: C.textoSec }}>Tarefa pai (opcional)</label>
              <select value={novaTarefa.tarefa_pai_id} onChange={e => setNovaTarefa({ ...novaTarefa, tarefa_pai_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">Nenhuma (tarefa principal)</option>
                {tarefasPai.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarFormTarefa(false)} style={{ flex: 1, padding: '10px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={criarTarefa} style={{ flex: 2, padding: '10px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Criar Tarefa</button>
            </div>
          </div>
        )}

        {tarefas.length === 0 && !mostrarFormTarefa && !mostrarGerador && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '15px' }}>Nenhuma tarefa. Clique em "Nova Tarefa" ou "Gerar com IA" para comecar.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tarefasPai.map(tarefa => (
            <div key={tarefa.id}>
              <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `4px solid ${coresStatus[tarefa.status] || C.royal}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: C.texto, fontSize: '14px' }}>{tarefa.titulo}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: C.textoMudo, flexWrap: 'wrap' }}>
                      {tarefa.responsavel && <span>👤 {tarefa.responsavel}</span>}
                      {tarefa.data_entrega && <span>📅 {new Date(tarefa.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      {tarefasFilho(tarefa.id).length > 0 && <span>📎 {tarefasFilho(tarefa.id).length} subtarefa(s)</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={tarefa.status} onChange={e => mudarStatusTarefa(tarefa.id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: coresStatus[tarefa.status] || C.royal, color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluido</option>
                    </select>
                    <button onClick={() => deletarTarefa(tarefa.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: C.textoMudo, padding: '4px' }}>🗑️</button>
                  </div>
                </div>
              </div>
              {tarefasFilho(tarefa.id).map(filho => (
                <div key={filho.id} style={{ marginLeft: '28px', marginTop: '4px', background: C.fundo, border: `1px solid ${C.borda}`, borderLeft: `4px solid ${coresStatus[filho.status] || C.textoMudo}`, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: C.texto, fontSize: '13px' }}>{filho.titulo}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: C.textoMudo }}>
                        {filho.responsavel && <span>👤 {filho.responsavel}</span>}
                        {filho.data_entrega && <span>📅 {new Date(filho.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select value={filho.status} onChange={e => mudarStatusTarefa(filho.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: coresStatus[filho.status] || C.textoMudo, color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluido</option>
                      </select>
                      <button onClick={() => deletarTarefa(filho.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: C.textoMudo, padding: '4px' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
