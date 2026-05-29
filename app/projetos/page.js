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
    return { bg: '#EEEDFE', color: '#534AB7' }
  }
  const cores = { pendente: '#f59e0b', em_andamento: '#3b82f6', concluido: '#10b981' }
  const tarefasPai = tarefas.filter(t => !t.tarefa_pai_id)
  const tarefasFilho = (paiId) => tarefas.filter(t => t.tarefa_pai_id === paiId)
  if (tela === 'lista') return (
    <div style={{ fontFamily: 'Arial', padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '14px' }}>Inicio</a>
          <h1 style={{ color: '#1e293b', margin: 0 }}>Projetos</h1>
        </div>
        <button onClick={() => setTela('novo')} style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
          + Novo Projeto
        </button>
      </div>
      {projetos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
          <p style={{ fontSize: '18px' }}>Nenhum projeto ainda</p>
          <p>Crie um projeto ou faca uma entrevista de processo</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {projetos.map(p => (
          <div key={p.id} onClick={() => abrirProjeto(p)} style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: '4px solid ' + (cores[p.status] || '#6366f1'), borderRadius: '8px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{p.titulo}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{p.responsavel || 'Sem responsavel'} • {new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: cores[p.status] || '#6366f1', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>{p.status}</span>
                <button onClick={e => deletarProjeto(e, p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8', padding: '4px' }} title="Deletar projeto">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (tela === 'novo') return (
    <div style={{ fontFamily: 'Arial', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}>Voltar</button>
      <h2 style={{ color: '#1e293b', marginBottom: '24px' }}>Novo Projeto</h2>
      <input placeholder="Titulo do projeto" value={novoProj.titulo} onChange={e => setNovoProj({ ...novoProj, titulo: e.target.value })}
        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', color: '#1e293b' }} />
      <input placeholder="Responsavel" value={novoProj.responsavel} onChange={e => setNovoProj({ ...novoProj, responsavel: e.target.value })}
        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', color: '#1e293b' }} />
      <textarea placeholder="Descricao (opcional)" value={novoProj.descricao} onChange={e => setNovoProj({ ...novoProj, descricao: e.target.value })} rows={3}
        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', resize: 'vertical', color: '#1e293b' }} />
      <button onClick={criarProjeto} style={{ width: '100%', padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
        Criar Projeto
      </button>
    </div>
  )
  if (tela === 'projeto') return (
    <div style={{ fontFamily: 'Arial', padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '8px', fontSize: '14px', padding: 0 }}>
            Voltar aos Projetos
          </button>
          <h1 style={{ color: '#1e293b', margin: 0 }}>{projetoAtivo.titulo}</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Responsavel: {projetoAtivo.responsavel || 'Nao definido'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setMostrarGerador(!mostrarGerador); setMostrarFormTarefa(false) }} style={{ background: '#EEEDFE', color: '#534AB7', padding: '10px 16px', borderRadius: '8px', border: '1px solid #CECBF6', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            ✨ Gerar com IA
          </button>
          <button onClick={() => { setMostrarFormTarefa(!mostrarFormTarefa); setMostrarGerador(false) }} style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
            + Nova Tarefa
          </button>
        </div>
      </div>
 
      {mostrarGerador && (
        <div style={{ background: 'white', border: '2px solid #CECBF6', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#534AB7' }}>✨ Gerar tarefas com IA</h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 14px' }}>Descreva o objetivo e a IA cria as tarefas automaticamente</p>
          <textarea
            placeholder="Ex: Precisamos migrar 3 servidores para AWS, incluindo testes de carga e treinamento da equipe..."
            value={objetivoIA}
            onChange={e => setObjetivoIA(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', color: '#1e293b' }}
          />
          <button
            onClick={gerarTarefasIA}
            disabled={gerandoIA}
            style={{ padding: '10px 20px', background: gerandoIA ? '#a5b4fc' : '#534AB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: gerandoIA ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {gerandoIA ? 'Gerando...' : '✨ Gerar tarefas'}
          </button>
 
          {tarefasIA.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Tarefas sugeridas</p>
                <span style={{ fontSize: '12px', background: '#E1F5EE', color: '#0F6E56', padding: '3px 10px', borderRadius: '20px' }}>{tarefasIA.length} tarefas geradas</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {tarefasIA.map((t, idx) => {
                  const cp = corPrioridade(t.prioridade)
                  return (
                    <div key={idx} onClick={() => toggleSelecionada(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: selecionadas.includes(idx) ? '#f8f7ff' : '#f8fafc', border: '1px solid ' + (selecionadas.includes(idx) ? '#CECBF6' : '#e2e8f0'), borderRadius: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selecionadas.includes(idx)} onChange={() => toggleSelecionada(idx)} style={{ width: '16px', height: '16px', accentColor: '#534AB7', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px', color: '#1e293b' }}>{t.titulo}</p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          {t.responsavel && <span>👤 {t.responsavel}</span>}
                          {t.prazo_dias && <span>📅 {t.prazo_dias} dias</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', background: cp.bg, color: cp.color, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{t.prioridade}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setTarefasIA([]); setObjetivoIA('') }} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  Cancelar
                </button>
                <button
                  onClick={adicionarTarefasSelecionadas}
                  disabled={adicionando || selecionadas.length === 0}
                  style={{ padding: '10px 20px', background: adicionando ? '#a5b4fc' : '#534AB7', color: 'white', border: 'none', borderRadius: '8px', cursor: adicionando ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  {adicionando ? 'Adicionando...' : 'Adicionar ' + selecionadas.length + ' tarefa(s) ao projeto'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
 
      {mostrarFormTarefa && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Nova Tarefa</h3>
          <input placeholder="Titulo da tarefa" value={novaTarefa.titulo} onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', color: '#1e293b' }} />
          <input placeholder="Responsavel" value={novaTarefa.responsavel} onChange={e => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', color: '#1e293b' }} />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#64748b' }}>Data inicio</label>
              <input type="date" value={novaTarefa.data_inicio} onChange={e => setNovaTarefa({ ...novaTarefa, data_inicio: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#64748b' }}>Data entrega</label>
              <input type="date" value={novaTarefa.data_entrega} onChange={e => setNovaTarefa({ ...novaTarefa, data_entrega: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#64748b' }}>Tarefa pai (opcional)</label>
            <select value={novaTarefa.tarefa_pai_id} onChange={e => setNovaTarefa({ ...novaTarefa, tarefa_pai_id: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
              <option value="">Nenhuma (tarefa principal)</option>
              {tarefasPai.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setMostrarFormTarefa(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={criarTarefa} style={{ flex: 2, padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Criar Tarefa</button>
          </div>
        </div>
      )}
 
      {tarefas.length === 0 && !mostrarFormTarefa && !mostrarGerador && (
        <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
          <p>Nenhuma tarefa. Clique em "Nova Tarefa" ou "Gerar com IA" para comecar.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tarefasPai.map(tarefa => (
          <div key={tarefa.id}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: '4px solid ' + (cores[tarefa.status] || '#6366f1'), borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1e293b' }}>{tarefa.titulo}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
                    {tarefa.responsavel && <span>👤 {tarefa.responsavel}</span>}
                    {tarefa.data_entrega && <span>📅 {new Date(tarefa.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    {tarefasFilho(tarefa.id).length > 0 && <span>📎 {tarefasFilho(tarefa.id).length} subtarefa(s)</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select value={tarefa.status} onChange={e => mudarStatusTarefa(tarefa.id, e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: cores[tarefa.status] || '#94a3b8', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluido</option>
                  </select>
                  <button onClick={() => deletarTarefa(tarefa.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#94a3b8', padding: '4px' }} title="Deletar tarefa">🗑️</button>
                </div>
              </div>
            </div>
            {tarefasFilho(tarefa.id).map(filho => (
              <div key={filho.id} style={{ marginLeft: '32px', marginTop: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid ' + (cores[filho.status] || '#94a3b8'), borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: '#334155' }}>{filho.titulo}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                      {filho.responsavel && <span>👤 {filho.responsavel}</span>}
                      {filho.data_entrega && <span>📅 {new Date(filho.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={filho.status} onChange={e => mudarStatusTarefa(filho.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: cores[filho.status] || '#94a3b8', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluido</option>
                    </select>
                    <button onClick={() => deletarTarefa(filho.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#94a3b8', padding: '4px' }} title="Deletar subtarefa">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}