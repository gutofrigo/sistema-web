'use client'
import { useState, useEffect } from 'react'
import { Map, Lightbulb, CheckCircle2, Puzzle, Brain, AlertTriangle, BarChart3, Users, Trash2, LayoutDashboard, Loader2 } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

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
    if (data.erro) { alert('Erro: ' + data.erro); setTela('novo'); return }
    setResultado(data.dados)
    setTela('resultado')
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

  async function verRoadmap(id) {
    const res = await fetch('/api/roadmap?id=' + id)
    const data = await res.json()
    if (data && !data.erro) { setResultado(data); setTela('resultado') }
    else alert('Nao foi possivel carregar este roadmap')
  }

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '13px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }
  const inputStyle = { width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }

  // ── TELA: Gerando ───────────────────────────────────────────────────────────
  if (tela === 'gerando') return (
    <div style={{ fontFamily: 'var(--font-nunito), Arial, sans-serif', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={44} color={C.royal} className="spin" style={{ marginBottom: '20px' }} />
        <p style={{ color: C.texto, fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Gerando seu roadmap com IA...</p>
        <p style={{ color: C.textoSec, fontSize: '14px' }}>Identificando oportunidades e estruturando fases</p>
      </div>
    </div>
  )

  // ── TELA: Novo Roadmap ───────────────────────────────────────────────────────
  if (tela === 'novo') return (
    <AppShell title="Novo Roadmap" subtitle="Roadmaps" actions={<button onClick={() => setTela('lista')} style={btnHeader}>← Voltar</button>}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
        <div style={{ background: C.branco, borderRadius: '10px', padding: '32px', width: '100%', maxWidth: '540px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
          <h2 style={{ color: C.texto, marginBottom: '6px', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}><Map size={20} color={C.royal} /> Novo Roadmap</h2>
          <p style={{ color: C.textoSec, fontSize: '13px', marginBottom: '24px' }}>A IA vai identificar oportunidades e criar um plano completo</p>

          <input placeholder="Titulo da iniciativa (ex: App de financas para freelancers)" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} />
          <textarea placeholder="Descricao da ideia — quanto mais detalhe, melhor o roadmap gerado" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={4}
            style={{ ...inputStyle, resize: 'vertical' }} />
          <input placeholder="Responsavel pelo projeto" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} style={inputStyle} />
          <input placeholder="Area (ex: Tecnologia, Marketing, RH)" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} style={inputStyle} />
          <select value={form.porte} onChange={e => setForm({ ...form, porte: e.target.value })}
            style={{ ...inputStyle, marginBottom: '20px' }}>
            <option value="pequeno">Pequeno (ate 3 meses)</option>
            <option value="medio">Medio (3 a 6 meses)</option>
            <option value="grande">Grande (6+ meses)</option>
          </select>
          <button onClick={gerarRoadmap}
            style={{ width: '100%', padding: '13px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            Gerar Roadmap com IA
          </button>
        </div>
      </div>
    </AppShell>
  )

  // ── TELA: Resultado ──────────────────────────────────────────────────────────
  if (tela === 'resultado' && resultado) return (
    <AppShell
      title="Roadmap do Projeto"
      subtitle="Roadmaps"
      actions={
        <>
          <button onClick={() => setTela('lista')} style={btnHeader}>← Lista</button>
          <button onClick={() => { setForm({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' }); setTela('novo') }} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: C.textoSobreAccent, border: 'none' }}>+ Novo Roadmap</button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {resultado.resumo && (
          <div style={{ background: C.branco, borderRadius: '10px', padding: '24px', marginBottom: '16px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.navy}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
            <p style={{ color: C.textoSec, fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{resultado.resumo}</p>
          </div>
        )}

        {resultado.oportunidades && resultado.oportunidades.length > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ color: '#166534', fontSize: '15px', margin: '0 0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={16} /> Oportunidades identificadas pela IA</h2>
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
          const cf = corFase(fase.cor, idx)
          return (
            <div key={idx} style={{ background: C.branco, borderRadius: '8px', padding: '24px', marginBottom: '12px', border: `1px solid ${C.borda}`, borderLeft: `4px solid ${cf.borda}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ color: C.texto, fontSize: '16px', margin: 0, fontWeight: 'bold' }}>
                  {cf.icone} Fase {fase.numero} — {fase.nome}
                </h2>
                {fase.duracao && (
                  <span style={{ fontSize: '12px', color: C.textoSec, background: C.fundo, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${C.borda}` }}>{fase.duracao}</span>
                )}
              </div>
              {fase.objetivo && (
                <p style={{ color: C.textoSec, fontSize: '14px', margin: '0 0 14px', fontStyle: 'italic' }}>Objetivo: {fase.objetivo}</p>
              )}
              {fase.acoes && fase.acoes.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: C.texto, fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={13} /> Acoes:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px' }}>
                    {fase.acoes.map((a, i) => (
                      <span key={i} style={{ color: C.textoSec, fontSize: '13px', lineHeight: '1.5' }}>• {a}</span>
                    ))}
                  </div>
                </div>
              )}
              {fase.tecnologias && fase.tecnologias.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: C.texto, fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={13} /> Tecnologias sugeridas:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {fase.tecnologias.map((t, i) => (
                      <span key={i} style={{ background: cf.bg, color: cf.texto, fontSize: '12px', padding: '3px 10px', borderRadius: '20px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {fase.resultado_esperado && (
                <div style={{ background: cf.bg, borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color={cf.texto} />
                  <span style={{ color: cf.texto, fontSize: '13px' }}>Resultado esperado: {fase.resultado_esperado}</span>
                </div>
              )}
            </div>
          )
        })}

        {resultado.estrutura_resumida && (
          <div style={{ background: C.navy, borderRadius: '10px', padding: '20px 24px', marginBottom: '12px', textAlign: 'center' }}>
            <p style={{ color: C.textoMudo, fontSize: '12px', margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Puzzle size={13} /> Estrutura resumida</p>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>{resultado.estrutura_resumida}</p>
          </div>
        )}

        {resultado.ideias_extras && resultado.ideias_extras.length > 0 && (
          <div style={{ background: C.branco, borderRadius: '10px', padding: '24px', marginBottom: '12px', border: `1px solid ${C.borda}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
            <h2 style={{ color: C.texto, fontSize: '15px', margin: '0 0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Brain size={16} color={C.royal} /> Ideias extras de evolucao</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {resultado.ideias_extras.map((ideia, i) => (
                <span key={i} style={{ color: C.textoSec, fontSize: '14px' }}>• {ideia}</span>
              ))}
            </div>
          </div>
        )}

        {resultado.por_que_bom && resultado.por_que_bom.length > 0 && (
          <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '10px', padding: '24px', marginBottom: '12px' }}>
            <h2 style={{ color: '#854d0e', fontSize: '15px', margin: '0 0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> Por que esse projeto e bom</h2>
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
          <div style={{ background: C.branco, borderRadius: '10px', padding: '24px', marginBottom: '12px', border: `1px solid ${C.borda}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
            <h2 style={{ color: C.texto, fontSize: '15px', margin: '0 0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} color={C.ambar} /> Riscos identificados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resultado.riscos.map((r, i) => (
                <div key={i} style={{ background: '#fef2f2', borderRadius: '6px', padding: '14px' }}>
                  <p style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px' }}>{r.descricao}</p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '20px' }}>Prob: {r.probabilidade}</span>
                    <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '20px' }}>Impacto: {r.impacto}</span>
                  </div>
                  {r.mitigacao && <p style={{ color: C.textoSec, fontSize: '13px', margin: 0 }}>Mitigacao: {r.mitigacao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {resultado.kpis && resultado.kpis.length > 0 && (
            <div style={{ background: C.branco, borderRadius: '10px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
              <h2 style={{ color: C.texto, fontSize: '15px', margin: '0 0 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={16} color={C.royal} /> KPIs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resultado.kpis.map((k, i) => (
                  <span key={i} style={{ color: C.textoSec, fontSize: '13px' }}>• {k}</span>
                ))}
              </div>
            </div>
          )}
          {resultado.stakeholders && resultado.stakeholders.length > 0 && (
            <div style={{ background: C.branco, borderRadius: '10px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
              <h2 style={{ color: C.texto, fontSize: '15px', margin: '0 0 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} color={C.royal} /> Stakeholders</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resultado.stakeholders.map((s, i) => (
                  <span key={i} style={{ color: C.textoSec, fontSize: '13px' }}>• {s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )

  // ── TELA: Lista ──────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="Roadmaps"
      subtitle="Sistema de Melhoria"
      actions={
        <>
          <a href="/pmo" className="btn-ghost-hover" style={{ ...btnHeader, background: C.branco }}><LayoutDashboard size={14} /> PMO</a>
          <button onClick={() => { setForm({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' }); setTela('novo') }} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: C.textoSobreAccent, border: 'none' }}>+ Novo Roadmap</button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {roadmaps.length === 0 ? (
          <div style={{ background: C.branco, borderRadius: '10px', padding: '60px', textAlign: 'center', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
            <Map size={40} color={C.royal} style={{ marginBottom: '16px' }} />
            <p style={{ color: C.texto, fontSize: '17px', fontWeight: 'bold', marginBottom: '8px' }}>Nenhum roadmap ainda</p>
            <p style={{ color: C.textoMudo, fontSize: '14px', marginBottom: '24px' }}>Crie seu primeiro roadmap com IA</p>
            <button onClick={() => { setForm({ titulo: '', descricao: '', responsavel: '', porte: 'medio', area: '' }); setTela('novo') }}
              className="btn-hover" style={{ padding: '11px 24px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 700 }}>
              Criar primeiro roadmap
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {roadmaps.map(r => (
              <div key={r.id} onClick={() => verRoadmap(r.id)}
                style={{ background: C.branco, borderRadius: '10px', padding: '20px 24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px', color: C.texto }}>{r.titulo}</p>
                  <p style={{ fontSize: '13px', color: C.textoMudo, margin: 0 }}>{r.area || 'Sem area'} • {diasAtras(r.criado_em)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#EEF2FF', color: C.royal, whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                    {labelPorte(r.porte)}
                  </span>
                  <button onClick={e => deletarRoadmap(e, r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: C.textoMudo }} title="Deletar"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
