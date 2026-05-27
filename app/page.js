'use client'
import { useState } from 'react'

const perguntas = [
  "Descreva como funciona esse processo do início ao fim.",
  "Quais são as principais dificuldades nesse processo?",
  "Quanto tempo leva para completar esse processo?",
  "Quais etapas geram mais retrabalho?",
  "Se pudesse mudar uma coisa, o que seria?"
]

export default function Home() {
  const [etapa, setEtapa] = useState('inicio')
  const [processo, setProcesso] = useState('')
  const [nome, setNome] = useState('')
  const [respostas, setRespostas] = useState([])
  const [resposta, setResposta] = useState('')
  const [perguntaAtual, setPerguntaAtual] = useState(0)
  const [relatorio, setRelatorio] = useState('')
  const [carregando, setCarregando] = useState(false)

  function iniciar() {
    if (processo && nome) setEtapa('entrevista')
  }

  function responder() {
    if (!resposta) return
    const novas = [...respostas, { pergunta: perguntas[perguntaAtual], resposta }]
    setRespostas(novas)
    setResposta('')
    if (perguntaAtual + 1 < perguntas.length) {
      setPerguntaAtual(perguntaAtual + 1)
    } else {
      gerarRelatorio(novas)
    }
  }

  async function gerarRelatorio(rs) {
    setEtapa('carregando')
    setCarregando(true)
    const res = await fetch('/api/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processo, nome, respostas: rs })
    })
    const data = await res.json()
    setRelatorio(data.relatorio)
    setEtapa('relatorio')
    setCarregando(false)
  }

  return (
    <main style={{ maxWidth: 600, margin: '60px auto', padding: 24, fontFamily: 'sans-serif' }}>

      {etapa === 'inicio' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>🗂️ Análise de Processos</h1>
          <p style={{ color: '#666', marginBottom: 24 }}>Responda 5 perguntas e receba um relatório de melhorias com IA</p>
          <input
            placeholder="Nome do processo (ex: Abertura de chamados)"
            value={processo}
            onChange={e => setProcesso(e.target.value)}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
          />
          <input
            placeholder="Seu nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
          />
          <button
            onClick={iniciar}
            style={{ background: '#5B6BF8', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, width: '100%' }}
          >
            Iniciar Entrevista →
          </button>
        </div>
      )}

      {etapa === 'entrevista' && (
        <div>
          <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>Pergunta {perguntaAtual + 1} de {perguntas.length} — {processo}</p>
          <div style={{ background: '#F7F8FA', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: '500' }}>{perguntas[perguntaAtual]}</p>
          </div>
          <textarea
            placeholder="Digite sua resposta aqui..."
            value={resposta}
            onChange={e => setResposta(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'none' }}
          />
          <button
            onClick={responder}
            style={{ background: '#5B6BF8', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, width: '100%', marginTop: 12 }}
          >
            {perguntaAtual + 1 < perguntas.length ? 'Próxima →' : 'Gerar Relatório 🤖'}
          </button>
        </div>
      )}

      {etapa === 'carregando' && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 18 }}>🤖 A IA está analisando suas respostas...</p>
          <p style={{ color: '#999', marginTop: 8 }}>Isso pode levar alguns segundos</p>
        </div>
      )}

      {etapa === 'relatorio' && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>📋 Relatório — {processo}</h2>
          <div style={{ background: '#F7F8FA', borderRadius: 10, padding: 20, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>
            {relatorio}
          </div>
          <button
            onClick={() => { setEtapa('inicio'); setRespostas([]); setPerguntaAtual(0); setProcesso(''); setNome('') }}
            style={{ background: '#22C55E', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, width: '100%', marginTop: 16 }}
          >
            Nova Análise
          </button>
        </div>
      )}

    </main>
  )
}