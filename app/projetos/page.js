'use client'
import { useState, useEffect } from 'react'
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
    await fetch('/api/projetos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoProj)
    })
    setNovoProj({ titulo: '', responsavel: '', descricao: '' })
    setTela('lista')
    buscarProjetos()
  }
  async function deletarProjeto(e, id) {
    e.stopPropagation()
    if (!confirm('Deletar este projeto e todas as suas tarefas?')) return
    await fetch('/api/projetos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    buscarProjetos()
  }
  async function deletarTarefa(id) {
    if (!confirm('Deletar esta tarefa?')) return
    await fetch('/api/tarefas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    buscarTarefas(projetoAtivo.id)
  }
  async function abrirProjeto(projeto) {
    setProjetoAtivo(projeto)
    await buscarTarefas(projeto.id)
    setTela('projeto')
  }
  async function criarTarefa() {
    if (!novaTarefa.titulo) return alert('Digite o titulo da tarefa')
    await fetch('/api/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...novaTarefa, projeto_id: projetoAtivo.id })
    })
    setNovaTarefa({ titulo: '', responsavel: '', data_inicio: '', data_entrega: '', status: 'pendente', tarefa_pai_id: '' })
    setMostrarFormTarefa(false)
    buscarTarefas(projetoAtivo.id)
  }
  async function mudarStatusTarefa(id, status) {
    await fetch('/api/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: status })
    })
    buscarTarefas(projetoAtivo.id)
  }
  async function gerarTarefasIA() {
    if (!objetivoIA.trim()) return alert('Descreva o objetivo')
    setGerandoIA(true)
    setTarefasIA([])
    const res = await fetch('/api/gerar-tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objetivo: objetivoIA, projeto: projetoAtivo.titulo })
    })
    const data = await res.json()
    if (data.erro) {
      alert('Erro: ' + data.erro)
    } else {
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
      await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: t.titulo,
          responsavel: t.responsavel || '',
          data_entrega: dataEntrega.toISOString().split('T')[0],
          status: 'pendente',
          projeto_id: projetoAtivo.id
        })
      })
    }
    setAdicionando(false)
    setMostrarGerador(false)
    setObjetivoIA('')
    setTarefasIA([])
    setSelecionadas([])
    buscarTarefas(projetoAtivo.id)
  }
  function toggleSelecionada(idx) {
    if (selecionadas.includes(idx)) {
      setSelecionadas(selecionadas.filter(i => i !== idx))
    } else {
      setSelecionadas([...selecionadas, idx])
    }
  }
  function corPrioridade(p) {
    if (p === 'alta') return { bg: '#FAEEDA', color: '#854F0B' }
    if (p === 'baixa') return { bg: '#E1F5EE', color: '#0F6E56' }
    return { bg: '#e8edf2', color: '#2e4a63' }
  }
  const cores = { pendente: '#f59e0b', em_andamento: '#3b82f6', concluido: '#10b981' }
  const tarefasPai = tarefas.filter(t => !t.tarefa_pai_id)
  const tarefasFilho = (paiId) => tarefas.filter(t => t.tarefa_pai_id === paiId)

  if (tela === 'lista') return (
    <div className="page-pad" style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', textDecoration: 'none', color: '#2e4a63', fontSize: '13px', fontWeight: 'bold' }}>← Inicio</a>
            <h1 style={{ color: '#1c2b3a', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Projetos</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/gantt" style={{ padding: '9px 16px', background: 'white', color: '#5a6a7a', borderRadius: '6px', border: '1px solid #d6dbe0', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📊 Ver Gantt
            </a>
            <button onClick={() => setTela('novo')} style={{ background: '#1c2b3a', color: 'white', padding: '9px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              + Novo Projeto
            </button>
          </div>
        </div>
        {projetos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px', color: '#5a6a7a', border: '1px solid #d6dbe0' }}>
            <p style={{ fontSize: '17px' }}>Nenhum projeto ainda</p>
            <p style={{ fontSize: '14px' }}>Crie um projeto ou faca uma entrevista de processo</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projetos.map(p => (
            <div key={p.id} onClick={() => abrirProjeto(p)} style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '4px solid ' + (cores[p.status] || '#2e4a63'), borderRadius: '8px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#1c2b3a', fontSize: '15px' }}>{p.titulo}</h3>
                  <p style={{ margin: 0, color: '#8fa3b1', fontSize: '13px' }}>{p.responsavel || 'Sem responsavel'} • {new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: cores[p.status] || '#2e4a63', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{p.status}</span>
                  <button onClick={e => deletarProjeto(e, p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#8fa3b1', padding: '4px' }} title="Deletar projeto">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (tela === 'novo') return (
    <div className="page-pad" style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setTela('lista')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', color: '#2e4a63', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>← Voltar</button>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', textDecoration: 'none', color: '#2e4a63', fontSize: '13px', fontWeight: 'bold' }}>← Inicio</a>
        </div>
        <div style={{ background: 'white', borderRadius: '8px', padding: '32px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63' }}>
          <h2 style={{ color: '#1c2b3a', marginBottom: '24px', fontSize: '20px', fontWeight: 'bold' }}>Novo Projeto</h2>
          <input placeholder="Titulo do projeto" value={novoProj.titulo} onChange={e => setNovoProj({ ...novoProj, titulo: e.target.value })}
            style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1c2b3a' }} />
          <input placeholder="Responsavel" value={novoProj.responsavel} onChange={e => setNovoProj({ ...novoProj, responsavel: e.target.value })}
            style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1c2b3a' }} />
          <textarea placeholder="Descricao (opcional)" value={novoProj.descricao} onChange={e => setNovoProj({ ...novoProj, descricao: e.target.value })} rows={3}
            style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', resize: 'vertical', color: '#1c2b3a' }} />
          <button onClick={criarProjeto} style={{ width: '100%', padding: '13px', background: '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            Criar Projeto
          </button>
        </div>
      </div>
    </div>
  )

  if (tela === 'projeto') return (
    <div className="page-pad" style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <button onClick={() => setTela('lista')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', color: '#2e4a63', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Projetos
              </button>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', textDecoration: 'none', color: '#2e4a63', fontSize: '13px', fontWeight: 'bold' }}>
                ← Inicio
              </a>
            </div>
            <h1 style={{ color: '#1c2b3a', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>{projetoAtivo.titulo}</h1>
            <p style={{ color: '#8fa3b1', margin: '4px 0 0 0', fontSize: '13px' }}>Responsavel: {projetoAtivo.responsavel || 'Nao definido'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/gantt" style={{ padding: '9px 16px', background: 'white', color: '#5a6a7a', borderRadius: '6px', border: '1px solid #d6dbe0', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📊 Gantt
            </a>
            <button onClick={() => { setMostrarGerador(!mostrarGerador); setMostrarFormTarefa(false) }} style={{ background: '#e8edf2', color: '#2e4a63', padding: '9px 16px', borderRadius: '6px', border: '1px solid #d6dbe0', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
              ✨ Gerar com IA
            </button>
            <button onClick={() => { setMostrarFormTarefa(!mostrarFormTarefa); setMostrarGerador(false) }} style={{ background: '#1c2b3a', color: 'white', padding: '9px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              + Nova Tarefa
            </button>
          </div>
        </div>

        {mostrarGerador && (
          <div style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#1c2b3a', fontSize: '15px', fontWeight: 'bold' }}>✨ Gerar tarefas com IA</h3>
            <p style={{ color: '#5a6a7a', fontSize: '13px', margin: '0 0 14px' }}>Descreva o objetivo e a IA cria as tarefas automaticamente</p>
            <textarea
              placeholder="Ex: Precisamos migrar 3 servidores para AWS, incluindo testes de carga e treinamento da equipe..."
              value={objetivoIA}
              onChange={e => setObjetivoIA(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', color: '#1c2b3a' }}
            />
            <button onClick={gerarTarefasIA} disabled={gerandoIA} style={{ padding: '9px 20px', background: gerandoIA ? '#6b8fa3' : '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: gerandoIA ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {gerandoIA ? 'Gerando...' : '✨ Gerar tarefas'}
            </button>
            {tarefasIA.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 'bold', color: '#1c2b3a', margin: 0, fontSize: '14px' }}>Tarefas sugeridas</p>
                  <span style={{ fontSize: '12px', background: '#E1F5EE', color: '#0F6E56', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{tarefasIA.length} tarefas geradas</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {tarefasIA.map((t, idx) => {
                    const cp = corPrioridade(t.prioridade)
                    return (
                      <div key={idx} onClick={() => toggleSelecionada(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: selecionadas.includes(idx) ? '#f0f4f8' : '#f4f5f7', border: '1px solid ' + (selecionadas.includes(idx) ? '#2e4a63' : '#d6dbe0'), borderRadius: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selecionadas.includes(idx)} onChange={() => toggleSelecionada(idx)} style={{ width: '16px', height: '16px', accentColor: '#1c2b3a', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px', color: '#1c2b3a' }}>{t.titulo}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#8fa3b1' }}>
                            {t.responsavel && <span>👤 {t.responsavel}</span>}
                            {t.prazo_dias && <span>📅 {t.prazo_dias} dias</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', background: cp.bg, color: cp.color, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{t.prioridade}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setTarefasIA([]); setObjetivoIA('') }} style={{ padding: '9px 16px', background: '#f4f5f7', color: '#5a6a7a', border: '1px solid #d6dbe0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                  <button onClick={adicionarTarefasSelecionadas} disabled={adicionando || selecionadas.length === 0} style={{ padding: '9px 20px', background: adicionando ? '#6b8fa3' : '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', cursor: adicionando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    {adicionando ? 'Adicionando...' : 'Adicionar ' + selecionadas.length + ' tarefa(s) ao projeto'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mostrarFormTarefa && (
          <div style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1c2b3a', fontSize: '15px', fontWeight: 'bold' }}>Nova Tarefa</h3>
            <input placeholder="Titulo da tarefa" value={novaTarefa.titulo} onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', color: '#1c2b3a' }} />
            <input placeholder="Responsavel" value={novaTarefa.responsavel} onChange={e => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', color: '#1c2b3a' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#5a6a7a' }}>Data inicio</label>
                <input type="date" value={novaTarefa.data_inicio} onChange={e => setNovaTarefa({ ...novaTarefa, data_inicio: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#5a6a7a' }}>Data entrega</label>
                <input type="date" value={novaTarefa.data_entrega} onChange={e => setNovaTarefa({ ...novaTarefa, data_entrega: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#5a6a7a' }}>Tarefa pai (opcional)</label>
              <select value={novaTarefa.tarefa_pai_id} onChange={e => setNovaTarefa({ ...novaTarefa, tarefa_pai_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">Nenhuma (tarefa principal)</option>
                {tarefasPai.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarFormTarefa(false)} style={{ flex: 1, padding: '10px', background: '#f4f5f7', color: '#5a6a7a', border: '1px solid #d6dbe0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={criarTarefa} style={{ flex: 2, padding: '10px', background: '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Criar Tarefa</button>
            </div>
          </div>
        )}

        {tarefas.length === 0 && !mostrarFormTarefa && !mostrarGerador && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px', color: '#5a6a7a', border: '1px solid #d6dbe0' }}>
            <p style={{ fontSize: '15px' }}>Nenhuma tarefa. Clique em "Nova Tarefa" ou "Gerar com IA" para comecar.</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tarefasPai.map(tarefa => (
            <div key={tarefa.id}>
              <div style={{ background: 'white', border: '1px solid #d6dbe0', borderLeft: '4px solid ' + (cores[tarefa.status] || '#2e4a63'), borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1c2b3a', fontSize: '14px' }}>{tarefa.titulo}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#8fa3b1' }}>
                      {tarefa.responsavel && <span>👤 {tarefa.responsavel}</span>}
                      {tarefa.data_entrega && <span>📅 {new Date(tarefa.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      {tarefasFilho(tarefa.id).length > 0 && <span>📎 {tarefasFilho(tarefa.id).length} subtarefa(s)</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={tarefa.status} onChange={e => mudarStatusTarefa(tarefa.id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d6dbe0', background: cores[tarefa.status] || '#8fa3b1', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluido</option>
                    </select>
                    <button onClick={() => deletarTarefa(tarefa.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#8fa3b1', padding: '4px' }} title="Deletar tarefa">🗑️</button>
                  </div>
                </div>
              </div>
              {tarefasFilho(tarefa.id).map(filho => (
                <div key={filho.id} style={{ marginLeft: '32px', marginTop: '4px', background: '#f4f5f7', border: '1px solid #d6dbe0', borderLeft: '4px solid ' + (cores[filho.status] || '#8fa3b1'), borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: '#1c2b3a', fontSize: '13px' }}>{filho.titulo}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#8fa3b1' }}>
                        {filho.responsavel && <span>👤 {filho.responsavel}</span>}
                        {filho.data_entrega && <span>📅 {new Date(filho.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select value={filho.status} onChange={e => mudarStatusTarefa(filho.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d6dbe0', background: cores[filho.status] || '#8fa3b1', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluido</option>
                      </select>
                      <button onClick={() => deletarTarefa(filho.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#8fa3b1', padding: '4px' }} title="Deletar subtarefa">🗑️</button>
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
