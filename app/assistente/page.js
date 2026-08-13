'use client'
import { useState, useEffect, useRef } from 'react'
import { Sparkles, LayoutDashboard } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

const perguntasSugeridas = [
  'Quais projetos estao em risco de atraso?',
  'Quais tarefas vencem essa semana?',
  'Resuma o que foi concluido',
  'Quem tem mais tarefas pendentes?',
  'Qual projeto tem mais tarefas atrasadas?'
]

export default function Assistente() {
  const [mensagens, setMensagens] = useState([
    { tipo: 'assistente', texto: 'Ola! Sou seu assistente de gestao. Tenho acesso a todos os seus projetos, tarefas e roadmaps. Como posso ajudar?' }
  ])
  const [pergunta, setPergunta] = useState('')
  const [carregando, setCarregando] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    if (fimRef.current) fimRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar(texto) {
    const p = texto || pergunta
    if (!p.trim() || carregando) return
    const novasMensagens = [...mensagens, { tipo: 'usuario', texto: p }]
    setMensagens(novasMensagens)
    setPergunta('')
    setCarregando(true)
    const historico = novasMensagens.slice(1)
    const res = await fetch('/api/assistente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta: p, historico })
    })
    const data = await res.json()
    if (data.erro) {
      setMensagens([...novasMensagens, { tipo: 'assistente', texto: 'Desculpe, ocorreu um erro. Tente novamente.' }])
    } else {
      setMensagens([...novasMensagens, { tipo: 'assistente', texto: data.resposta }])
    }
    setCarregando(false)
  }

  function teclaEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <AppShell
      title="Assistente IA"
      subtitle="Pergunte sobre seus projetos e tarefas"
      actions={
        <a href="/pmo" className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', border: `1px solid ${C.borda}`, color: C.texto, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          <LayoutDashboard size={14} /> PMO
        </a>
      }
    >
      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mensagens.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.tipo === 'usuario' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '80%' }}>
                {m.tipo === 'assistente' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={15} color="white" /></div>
                )}
                <div style={{
                  background: m.tipo === 'usuario' ? C.navy : 'white',
                  color: m.tipo === 'usuario' ? 'white' : C.texto,
                  borderRadius: m.tipo === 'usuario' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  border: m.tipo === 'assistente' ? `1px solid ${C.borda}` : 'none',
                  whiteSpace: 'pre-wrap',
                  boxShadow: m.tipo === 'assistente' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                }}>
                  {m.texto}
                </div>
              </div>
            </div>
          ))}
          {carregando && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={15} color="white" /></div>
                <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderRadius: '0 12px 12px 12px', padding: '12px 16px', color: C.textoMudo, fontSize: '14px' }}>
                  Analisando seus dados...
                </div>
              </div>
            </div>
          )}
          <div ref={fimRef} />
        </div>

        {mensagens.length === 1 && (
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '13px', color: C.textoMudo, marginBottom: '10px' }}>Sugestoes de perguntas:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {perguntasSugeridas.map((s, i) => (
                <button key={i} onClick={() => enviar(s)} style={{ fontSize: '13px', padding: '7px 14px', borderRadius: '20px', background: 'white', color: C.royal, border: `1px solid ${C.borda}`, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ background: 'white', borderTop: `1px solid ${C.borda}`, padding: '16px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <textarea
            placeholder="Pergunte sobre seus projetos, tarefas ou roadmaps... (Enter para enviar)"
            value={pergunta}
            onChange={e => setPergunta(e.target.value)}
            onKeyDown={teclaEnter}
            rows={2}
            style={{ flex: 1, padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', color: C.texto, fontFamily: 'Arial' }}
          />
          <button
            onClick={() => enviar()}
            disabled={carregando || !pergunta.trim()}
            style={{ padding: '12px 20px', background: carregando || !pergunta.trim() ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 'bold', alignSelf: 'flex-end' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </AppShell>
  )
}
