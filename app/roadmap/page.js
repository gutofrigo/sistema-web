'use client'
import { useState, useEffect } from 'react'

export default function Roadmap() {
  const [tela, setTela] = useState('lista')
  const [roadmaps, setRoadmaps] = useState([])
  const [roadmapAtivo, setRoadmapAtivo] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [gerandoIA, setGerandoIA] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' })

  useEffect(() => { buscarRoadmaps() }, [])

  async function buscarRoadmaps() {
    setCarregando(true)
    const res = await fetch('/api/roadmap')
    const data = await res.json()
    if (data.roadmaps) setRoadmaps(data.roadmaps)
    setCarregando(false)
  }

  async function gerarRoadmap() {
    if (!form.titulo || !form.descricao) return alert('Preencha o titulo e a descricao')
    setGerandoIA(true)
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setGerandoIA(false)
    if (data.erro) return alert('Erro: ' + data.erro)
    setRoadmapAtivo(data.roadmap)
    setTela('resultado')
    buscarRoadmaps()
  }

  const coresFase = ['#534AB7', '#185FA5', '#0F6E56', '#BA7517', '#5F5E5A']
  const bgsFase = ['#EEEDFE', '#E6F1FB', '#E1F5EE', '#FAEEDA', '#F1EFE8']
  const textFase = ['#3C3489', '#0C447C', '#085041', '#633806', '#444441']

  if (tela === 'lista') return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '14px' }}>Inicio</a>
            <h1 style={{ color: '#1e293b', margin: '4px 0 0' }}>Roadmaps de Projeto</h1>
          </div>
          <button onClick={() => setTela('novo')} style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
            + Novo Roadmap
          </button>
        </div>

        {carregando && <p style={{ color: '#64748b' }}>Carregando...</p>}

        {!carregando && roadmaps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#64748b' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🗺️</p>
            <p style={{ fontSize: '18px', margin: '0 0 8px' }}>Nenhum roadmap ainda</p>
            <p>Clique em "Novo Roadmap" e descreva sua iniciativa</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {roadmaps.map(r => (
            <div key={r.id} onClick={() => { setRoadmapAtivo(r); setTela('resultado') }} style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: '4px solid #6366f1', borderRadius: '8px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>{r.titulo}</h3>
                  <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>{r.area || 'Sem area'} • {r.porte} • {r.responsavel || 'Sem responsavel'}</p>
                </div>
                <span style={{ background: '#EEEDFE', color: '#3C3489', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>
                  {r.fases ? r.fases.length + ' fases' : '5 fases'}
                </span>
              </div>
              {r.resumo && <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{r.resumo.substring(0, 120)}...</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (tela === 'novo') return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '20px', fontSize: '14px', padding: 0 }}>
          Voltar
        </button>
        <h2 style={{ color: '#1e293b', marginBottom: '6px' }}>Nova Iniciativa</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>Descreva sua ideia e a IA gera um roadmap completo baseado no PMI</p>

        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Titulo da iniciativa</label>
        <input placeholder="Ex: Implantacao de sistema de ITSM" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
          style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '14px', boxSizing: 'border-box', color: '#1e293b' }} />

        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Descricao da ideia</label>
        <textarea placeholder="Descreva o objetivo, contexto e o que voce espera alcançar com esse projeto..." value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={4}
          style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '14px', boxSizing: 'border-box', resize: 'vertical', color: '#1e293b' }} />

        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Responsavel</label>
        <input placeholder="Seu nome" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })}
          style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '14px', boxSizing: 'border-box', color: '#1e293b' }} />

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Porte do projeto</label>
            <select value={form.porte} onChange={e => setForm({ ...form, porte: e.target.value })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#1e293b' }}>
              <option value="pequeno">Pequeno (ate 2 meses)</option>
              <option value="medio">Medio (3 a 6 meses)</option>
              <option value="grande">Grande (acima de 6 meses)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Area</label>
            <input placeholder="Ex: Tecnologia, RH, Financeiro" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: '#1e293b' }} />
          </div>
        </div>

        <button onClick={gerarRoadmap} disabled={gerandoIA}
          style={{ width: '100%', padding: '14px', background: gerandoIA ? '#94a3b8' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: gerandoIA ? 'not-allowed' : 'pointer' }}>
          {gerandoIA ? 'Gerando roadmap com IA... aguarde' : 'Gerar Roadmap com IA'}
        </button>
      </div>
    </div>
  )

  if (tela === 'resultado' && roadmapAtivo) {
    const fases = roadmapAtivo.fases || []
    const riscos = roadmapAtivo.riscos || []
    const pontos = roadmapAtivo.pontos_atencao || []
    const kpis = roadmapAtivo.kpis || []
    const stakeholders = roadmapAtivo.stakeholders || []

    const corRisco = (prob) => {
      if (prob === 'Alta') return { bg: '#fef2f2', text: '#dc2626', badge: '#F09595', badgeText: '#501313' }
      if (prob === 'Media') return { bg: '#fffbeb', text: '#d97706', badge: '#FAC775', badgeText: '#412402' }
      return { bg: '#f0fdf4', text: '#16a34a', badge: '#C0DD97', badgeText: '#173404' }
    }

    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: '0 0 8px' }}>
                Voltar aos Roadmaps
              </button>
              <h1 style={{ color: '#1e293b', margin: '0 0 4px' }}>{roadmapAtivo.titulo}</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>{roadmapAtivo.area} • {roadmapAtivo.porte} • {roadmapAtivo.responsavel} • Baseado no PMBOK</p>
            </div>
            <button onClick={() => setTela('novo')} style={{ background: '#6366f1', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>
              + Novo Roadmap
            </button>
          </div>

          {roadmapAtivo.resumo && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px' }}>Resumo executivo</p>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{roadmapAtivo.resumo}</p>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 16px' }}>Fases e atividades</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fases.map((fase, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: bgsFase[i] || '#f8fafc', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: textFase[i] || '#1e293b' }}>{fase.nome}</p>
                    <span style={{ fontSize: '12px', color: coresFase[i] || '#64748b' }}>{fase.periodo}</span>
                  </div>
                  <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(fase.atividades || []).map((at, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ color: '#334155' }}>{at.titulo}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>{at.responsavel}</span>
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>{at.duracao}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 14px' }}>Matriz de riscos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {riscos.map((r, i) => {
                  const cor = corRisco(r.probabilidade)
                  return (
                    <div key={i} style={{ background: cor.bg, borderRadius: '8px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: cor.text }}>{r.titulo}</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '20px', background: cor.badge, color: cor.badgeText }}>P: {r.probabilidade}</span>
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '20px', background: cor.badge, color: cor.badgeText }}>I: {r.impacto}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: cor.text, margin: 0 }}>{r.mitigacao}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 12px' }}>KPIs de sucesso</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {kpis.map((k, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '6px', borderBottom: i < kpis.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ color: '#475569' }}>{k.indicador}</span>
                      <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{k.meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 12px' }}>Stakeholders</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {stakeholders.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                      <span style={{ color: '#475569' }}>{s.nome}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EEEDFE', color: '#3C3489' }}>{s.papel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 14px' }}>Pontos criticos de atencao</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {pontos.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }}>•</span>
                  <p style={{ fontSize: '13px', margin: 0, color: '#475569' }}>{p}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }
}