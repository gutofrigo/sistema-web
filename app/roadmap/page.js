'use client'
import { useState, useEffect } from 'react'
const coresFase = {
  blue:   { borda: '#3b82f6', bg: '#eff6ff', icone: '🔵', texto: '#1e40af' },
  yellow: { borda: '#eab308', bg: '#fefce8', icone: '🟡', texto: '#854d0e' },
  orange: { borda: '#f97316', bg: '#fff7ed', icone: '🟠', texto: '#9a3412' },
  red:    { borda: '#ef4444', bg: '#fef2f2', icone: '🔴', texto: '#991b1b' },
  purple: { borda: '#8b5cf6', bg: '#f5f3ff', icone: '🟣', texto: '#5b21b6' }
}
function corFase(cor, idx) {
  if (coresFase[cor]) return coresFase[cor]
  const lista = ['blue', 'yellow', 'orange', 'red', 'purple']
  return coresFase[lista[idx % lista.length]]
}
function diasAtras(data) {
  const diff = Math.floor((new Date() - new Date(data)) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'hoje'
  if (diff === 1) return '1 dia atras'
  return diff + ' dias atras'
}
function labelPorte(porte) {
  if (porte === 'pequeno') return 'Pequeno'
  if (porte === 'grande') return 'Grande'
  return 'Medio'
}
export default function Roadmap() {
  const [tela, setTela] = useState('lista')
  const [roadmaps, setRoadmaps] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [gerandoId, setGerandoId] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [form, setForm] = useState({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' })
  useEffect(() => {
    if (tela === 'lista') buscarRoadmaps()
  }, [tela])
  async function buscarRoadmaps() {
    const res = await fetch('/api/roadmap')
    const data = await res.json()
    setRoadmaps(data)
  }
  async function gerarRoadmap() {
    if (!form.titulo || !form.responsavel) return alert('Preencha titulo e responsavel')
    setGerandoId(Date.now())
    setTela('gerando')
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.erro) {
      alert('Erro: ' + data.erro)
      setTela('novo')
      return
    }
    setResultado(data.dados)
    setTela('resultado')
  }
  async function deletarRoadmap(e, id) {
    e.stopPropagation()
    if (!confirm('Deletar este roadmap?')) return
    await fetch('/api/roadmap', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarRoadmaps()
  }
  async function verRoadmap(id) {
    const res = await fetch('/api/roadmap/' + id)
    const data = await res.json()
    if (data && !data.erro) {
      setResultado(data)
      setTela('resultado')
    } else {
      alert('Nao foi possivel carregar este roadmap')
    }
  }
  async function deletarRoadmap(e, id) {
    e.stopPropagation()
    if (!confirm('Deletar este roadmap?')) return
    await fetch('/api/roadmap', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    buscarRoadmaps()
  }
  if (tela === 'gerando') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🗺️</div>
          <p style={{ color: '#1e293b', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Gerando seu roadmap com IA...</p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Identificando oportunidades e estruturando fases</p>
        </div>
      </div>
    )
  }
  if (tela === 'novo') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '540px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}>
            ← Voltar
          </button>
          <h2 style={{ color: '#1e293b', marginBottom: '6px', fontSize: '22px' }}>🗺️ Novo Roadmap</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>A IA vai identificar oportunidades e criar um plano completo</p>
          <input
            placeholder="Titulo da iniciativa (ex: App de financas para freelancers)"
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1e293b' }}
          />
          <textarea
            placeholder="Descricao da ideia — quanto mais detalhe, melhor o roadmap gerado"
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            rows={4}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', color: '#1e293b' }}
          />
          <input
            placeholder="Responsavel pelo projeto"
            value={form.responsavel}
            onChange={e => setForm({ ...form, responsavel: e.target.value })}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1e293b' }}
          />
          <input
            placeholder="Area (ex: Tecnologia, Marketing, RH)"
            value={form.area}
            onChange={e => setForm({ ...form, area: e.target.value })}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1e293b' }}
          />
          <select
            value={form.porte}
            onChange={e => setForm({ ...form, porte: e.target.value })}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', color: '#1e293b' }}
          >
            <option value="pequeno">Pequeno (ate 3 meses)</option>
            <option value="medio">Medio (3 a 6 meses)</option>
            <option value="grande">Grande (6+ meses)</option>
          </select>
          <button
            onClick={gerarRoadmap}
            style={{ width: '100%', padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Gerar Roadmap com IA
          </button>
        </div>
      </div>
    )
  }
  if (tela === 'resultado' && resultado) {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px' }}>
              ← Voltar a lista
            </button>
            <button onClick={() => { setForm({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' }); setTela('novo') }} style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              + Novo Roadmap
            </button>
          </div>
 
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <h1 style={{ color: '#1e293b', fontSize: '24px', margin: '0 0 8px' }}>🗺️ Roadmap do Projeto</h1>
            {resultado.resumo && (
              <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{resultado.resumo}</p>
            )}
          </div>
 
          {resultado.oportunidades && resultado.oportunidades.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <h2 style={{ color: '#166534', fontSize: '16px', margin: '0 0 14px' }}>💡 Oportunidades identificadas pela IA</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resultado.oportunidades.map((op, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                    <span style={{ color: '#166534', fontSize: '14px', lineHeight: '1.5' }}>{op}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {resultado.fases && resultado.fases.map((fase, idx) => {
            const c = corFase(fase.cor, idx)
            return (
              <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '12px', borderLeft: '5px solid ' + c.borda, border: '1px solid #e2e8f0', borderLeftWidth: '5px', borderLeftColor: c.borda }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h2 style={{ color: '#1e293b', fontSize: '17px', margin: 0 }}>
                    {c.icone} Fase {fase.numero} — {fase.nome}
                  </h2>
                  {fase.duracao && (
                    <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: '20px' }}>{fase.duracao}</span>
                  )}
                </div>
                {fase.objetivo && (
                  <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 14px', fontStyle: 'italic' }}>Objetivo: {fase.objetivo}</p>
                )}
                {fase.acoes && fase.acoes.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: '#1e293b', fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px' }}>✅ Acoes:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px' }}>
                      {fase.acoes.map((a, i) => (
                        <span key={i} style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>• {a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {fase.tecnologias && fase.tecnologias.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: '#1e293b', fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px' }}>✅ Tecnologias sugeridas:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {fase.tecnologias.map((t, i) => (
                        <span key={i} style={{ background: c.bg, color: c.texto, fontSize: '12px', padding: '3px 10px', borderRadius: '20px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {fase.resultado_esperado && (
                  <div style={{ background: c.bg, borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ color: c.texto, fontSize: '13px' }}>✅ Resultado esperado: {fase.resultado_esperado}</span>
                  </div>
                )}
              </div>
            )
          })}
 
          {resultado.estrutura_resumida && (
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px' }}>🧩 Estrutura resumida</p>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>{resultado.estrutura_resumida}</p>
            </div>
          )}
 
          {resultado.ideias_extras && resultado.ideias_extras.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 14px' }}>🧠 Ideias extras de evolucao</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resultado.ideias_extras.map((ideia, i) => (
                  <span key={i} style={{ color: '#475569', fontSize: '14px' }}>• {ideia}</span>
                ))}
              </div>
            </div>
          )}
 
          {resultado.por_que_bom && resultado.por_que_bom.length > 0 && (
            <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '12px', padding: '24px', marginBottom: '12px' }}>
              <h2 style={{ color: '#854d0e', fontSize: '16px', margin: '0 0 14px' }}>✅ Por que esse projeto e bom</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resultado.por_que_bom.map((motivo, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#ca8a04', fontWeight: 'bold' }}>✓</span>
                    <span style={{ color: '#78350f', fontSize: '14px' }}>{motivo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {resultado.riscos && resultado.riscos.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 14px' }}>⚠️ Riscos identificados</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resultado.riscos.map((r, i) => (
                  <div key={i} style={{ background: '#fef2f2', borderRadius: '8px', padding: '14px' }}>
                    <p style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px' }}>{r.descricao}</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '20px' }}>Prob: {r.probabilidade}</span>
                      <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '20px' }}>Impacto: {r.impacto}</span>
                    </div>
                    {r.mitigacao && <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Mitigacao: {r.mitigacao}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
 
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {resultado.kpis && resultado.kpis.length > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 12px' }}>📊 KPIs</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {resultado.kpis.map((k, i) => (
                    <span key={i} style={{ color: '#475569', fontSize: '13px' }}>• {k}</span>
                  ))}
                </div>
              </div>
            )}
            {resultado.stakeholders && resultado.stakeholders.length > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 12px' }}>👥 Stakeholders</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {resultado.stakeholders.map((s, i) => (
                    <span key={i} style={{ color: '#475569', fontSize: '13px' }}>• {s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
 
        </div>
      </div>
    )
  }
  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <p style={{ color: '#64748b', margin: '0 0 4px', fontSize: '14px' }}>Sistema de Melhoria</p>
            <h1 style={{ color: '#1e293b', margin: 0, fontSize: '26px' }}>🗺️ Roadmaps</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/dashboard" style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', color: '#475569', fontSize: '14px' }}>
              Dashboard
            </a>
            <button
              onClick={() => { setForm({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' }); setTela('novo') }}
              style={{ padding: '8px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Novo Roadmap
            </button>
          </div>
        </div>
 
        {roadmaps.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
            <p style={{ color: '#1e293b', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Nenhum roadmap ainda</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Crie seu primeiro roadmap com IA</p>
            <button
              onClick={() => { setForm({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' }); setTela('novo') }}
              style={{ padding: '12px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
            >
              Criar primeiro roadmap
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {roadmaps.map(r => (
              <div
                key={r.id}
                onClick={() => verRoadmap(r.id)}
                style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #CECBF6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px', color: '#1e293b' }}>{r.titulo}</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{r.area || 'Sem area'} • {diasAtras(r.criado_em)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#EEEDFE', color: '#3C3489', whiteSpace: 'nowrap' }}>
                    {labelPorte(r.porte)}
                  </span>
                  <button
                    onClick={e => deletarRoadmap(e, r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', color: '#94a3b8' }}
                    title="Deletar"
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}