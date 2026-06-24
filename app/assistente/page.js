'use client'
import { useState, useEffect, useRef } from 'react'
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
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1c2b3a', borderBottom: '1px solid #2e4a63', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#2e4a63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✨</div>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'white' }}>Assistente IA</p>
            <p style={{ fontSize: '12px', color: '#8fa3b1', margin: 0 }}>Pergunte sobre seus projetos e tarefas</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/" style={{ padding: '7px 14px', background: '#2e4a63', border: '1px solid #3d5a73', borderRadius: '6px', textDecoration: 'none', color: 'white', fontSize: '13px', fontWeight: 'bold' }}>← Inicio</a>
          <a href="/dashboard" style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #3d5a73', borderRadius: '6px', textDecoration: 'none', color: '#8fa3b1', fontSize: '13px' }}>Dashboard</a>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mensagens.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.tipo === 'usuario' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '80%' }}>
                {m.tipo === 'assistente' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2e4a63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✨</div>
                )}
                <div style={{
                  background: m.tipo === 'usuario' ? '#1c2b3a' : 'white',
                  color: m.tipo === 'usuario' ? 'white' : '#1c2b3a',
                  borderRadius: m.tipo === 'usuario' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  border: m.tipo === 'assistente' ? '1px solid #d6dbe0' : 'none',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.texto}
                </div>
              </div>
            </div>
          ))}
          {carregando && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2e4a63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✨</div>
                <div style={{ background: 'white', border: '1px solid #d6dbe0', borderRadius: '0 12px 12px 12px', padding: '12px 16px', color: '#8fa3b1', fontSize: '14px' }}>
                  Analisando seus dados...
                </div>
              </div>
            </div>
          )}
          <div ref={fimRef} />
        </div>

        {mensagens.length === 1 && (
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '13px', color: '#8fa3b1', marginBottom: '10px' }}>Sugestoes de perguntas:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {perguntasSugeridas.map((s, i) => (
                <button key={i} onClick={() => enviar(s)} style={{ fontSize: '13px', padding: '7px 14px', borderRadius: '20px', background: 'white', color: '#2e4a63', border: '1px solid #d6dbe0', cursor: 'pointer', fontWeight: 'bold' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderTop: '1px solid #d6dbe0', padding: '16px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <textarea
            placeholder="Pergunte sobre seus projetos, tarefas ou roadmaps... (Enter para enviar)"
            value={pergunta}
            onChange={e => setPergunta(e.target.value)}
            onKeyDown={teclaEnter}
            rows={2}
            style={{ flex: 1, padding: '11px', border: '1px solid #d6dbe0', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', color: '#1c2b3a', fontFamily: 'Arial' }}
          />
          <button
            onClick={() => enviar()}
            disabled={carregando || !pergunta.trim()}
            style={{ padding: '12px 20px', background: carregando || !pergunta.trim() ? '#6b8fa3' : '#1c2b3a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 'bold', alignSelf: 'flex-end' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
