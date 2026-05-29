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
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✨</div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Assistente IA</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Pergunte sobre seus projetos e tarefas</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/" style={{ padding: '7px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', color: '#475569', fontSize: '13px' }}>Inicio</a>
          <a href="/dashboard" style={{ padding: '7px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', color: '#475569', fontSize: '13px' }}>Dashboard</a>
        </div>
      </div>
 
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mensagens.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.tipo === 'usuario' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '80%' }}>
                {m.tipo === 'assistente' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✨</div>
                )}
                <div style={{
                  background: m.tipo === 'usuario' ? '#534AB7' : 'white',
                  color: m.tipo === 'usuario' ? 'white' : '#1e293b',
                  borderRadius: m.tipo === 'usuario' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  border: m.tipo === 'assistente' ? '1px solid #e2e8f0' : 'none',
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
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✨</div>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 12px 12px 12px', padding: '12px 16px', color: '#94a3b8', fontSize: '14px' }}>
                  Analisando seus dados...
                </div>
              </div>
            </div>
          )}
          <div ref={fimRef} />
        </div>
 
        {mensagens.length === 1 && (
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Sugestoes de perguntas:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {perguntasSugeridas.map((s, i) => (
                <button key={i} onClick={() => enviar(s)} style={{ fontSize: '13px', padding: '7px 14px', borderRadius: '20px', background: '#EEEDFE', color: '#534AB7', border: '1px solid #CECBF6', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
 
      <div style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <textarea
            placeholder="Pergunte sobre seus projetos, tarefas ou roadmaps... (Enter para enviar)"
            value={pergunta}
            onChange={e => setPergunta(e.target.value)}
            onKeyDown={teclaEnter}
            rows={2}
            style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'Arial' }}
          />
          <button
            onClick={() => enviar()}
            disabled={carregando || !pergunta.trim()}
            style={{ padding: '12px 20px', background: carregando || !pergunta.trim() ? '#a5b4fc' : '#534AB7', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 'bold', alignSelf: 'flex-end' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}