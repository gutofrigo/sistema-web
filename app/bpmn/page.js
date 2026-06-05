'use client'
import { useState } from 'react'

const CORES_PARTICIPANTE = ['#EEF2FF', '#F0FDF4', '#FFF7ED', '#FDF2F8', '#F0F9FF', '#FFFBEB']
const BORDAS_PARTICIPANTE = ['#C7D2FE', '#BBF7D0', '#FED7AA', '#FBCFE8', '#BAE6FD', '#FDE68A']
const TEXTO_PARTICIPANTE = ['#3730A3', '#166534', '#9A3412', '#9D174D', '#075985', '#92400E']

function DiagramaBPMN({ dados }) {
  if (!dados || !dados.elementos) return null
  const participantes = dados.participantes || []
  const elementos = dados.elementos || []
  const conexoes = dados.conexoes || []
  const RAIA_H = 110
  const PADDING_TOP = 20
  const PADDING_LEFT = 50
  const ELEM_W = 100
  const ELEM_H = 40
  const COL_W = 140
  const totalH = participantes.length * RAIA_H + PADDING_TOP
  const grupos = {}
  participantes.forEach(p => { grupos[p] = [] })
  elementos.forEach(el => {
    if (!grupos[el.participante]) grupos[el.participante] = []
    grupos[el.participante].push(el)
  })
  const posicoes = {}
  const colunaGlobal = {}
  function getPosY(participante) {
    const idx = participantes.indexOf(participante)
    return PADDING_TOP + idx * RAIA_H + RAIA_H / 2
  }
  const visitados = new Set()
  function calcColunas(id, col) {
    if (visitados.has(id)) return
    visitados.add(id)
    colunaGlobal[id] = Math.max(colunaGlobal[id] || 0, col)
    const saidas = conexoes.filter(c => c.de === id)
    saidas.forEach((c) => calcColunas(c.para, col + 1))
  }
  const inicio = elementos.find(e => e.tipo === 'inicio')
  if (inicio) calcColunas(inicio.id, 0)
  elementos.forEach(el => {
    if (colunaGlobal[el.id] === undefined) colunaGlobal[el.id] = 0
    posicoes[el.id] = {
      x: PADDING_LEFT + 80 + colunaGlobal[el.id] * COL_W,
      y: getPosY(el.participante)
    }
  })
  const maxCol = Math.max(...Object.values(colunaGlobal))
  const totalW = Math.max(680, PADDING_LEFT + 80 + (maxCol + 1) * COL_W + 60)

  function renderElemento(el) {
    const pos = posicoes[el.id]
    if (!pos) return null
    const x = pos.x
    const y = pos.y
    if (el.tipo === 'inicio') {
      return (
        <g key={el.id}>
          <circle cx={x} cy={y} r={16} fill="white" stroke="#4338CA" strokeWidth="2"/>
          <circle cx={x} cy={y} r={10} fill="#4338CA"/>
          <text x={x} y={y + 28} fontSize="9" fill="#475569" textAnchor="middle" fontFamily="Arial">{el.nome}</text>
        </g>
      )
    }
    if (el.tipo === 'fim') {
      return (
        <g key={el.id}>
          <circle cx={x} cy={y} r={16} fill="white" stroke="#991b1b" strokeWidth="3"/>
          <circle cx={x} cy={y} r={10} fill="#991b1b"/>
          <text x={x} y={y + 28} fontSize="9" fill="#475569" textAnchor="middle" fontFamily="Arial">{el.nome}</text>
        </g>
      )
    }
    if (el.tipo === 'gateway') {
      return (
        <g key={el.id}>
          <polygon points={x + ',' + (y - 18) + ' ' + (x + 20) + ',' + y + ' ' + x + ',' + (y + 18) + ' ' + (x - 20) + ',' + y} fill="white" stroke="#94a3b8" strokeWidth="1.5"/>
          <text x={x} y={y + 4} fontSize="11" fill="#475569" textAnchor="middle" fontFamily="Arial" fontWeight="bold">?</text>
          <text x={x} y={y + 32} fontSize="9" fill="#475569" textAnchor="middle" fontFamily="Arial">{el.nome}</text>
        </g>
      )
    }
    return (
      <g key={el.id}>
        <rect x={x - ELEM_W / 2} y={y - ELEM_H / 2} width={ELEM_W} height={ELEM_H} rx="8" fill="white" stroke="#CBD5E1" strokeWidth="1.5"/>
        <text x={x} y={y - 4} fontSize="9" fill="#1e293b" textAnchor="middle" fontFamily="Arial">{el.nome.length > 14 ? el.nome.substring(0, 14) + '...' : el.nome}</text>
        <text x={x} y={y + 8} fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="Arial">{el.participante}</text>
      </g>
    )
  }

  function renderConexao(c, idx) {
    const origem = posicoes[c.de]
    const destino = posicoes[c.para]
    if (!origem || !destino) return null
    const elOrigem = elementos.find(e => e.id === c.de)
    const elDestino = elementos.find(e => e.id === c.para)
    let x1 = origem.x + (elOrigem && elOrigem.tipo === 'gateway' ? 20 : ELEM_W / 2)
    let y1 = origem.y
    let x2 = destino.x - (elDestino && elDestino.tipo === 'gateway' ? 20 : ELEM_W / 2)
    let y2 = destino.y
    if (origem.x === destino.x && origem.y !== destino.y) {
      x1 = origem.x
      y1 = origem.y + (origem.y < destino.y ? ELEM_H / 2 : -ELEM_H / 2)
      x2 = destino.x
      y2 = destino.y + (origem.y < destino.y ? -ELEM_H / 2 : ELEM_H / 2)
    }
    const corLinha = c.label === 'Sim' || c.label === 'sim' ? '#16a34a' : c.label === 'Nao' || c.label === 'nao' ? '#dc2626' : '#94a3b8'
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    return (
      <g key={idx}>
        <defs>
          <marker id={'arr' + idx} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={corLinha}/>
          </marker>
        </defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={corLinha} strokeWidth="1.5" markerEnd={'url(#arr' + idx + ')'}/>
        {c.label && <text x={mx} y={my - 4} fontSize="9" fill={corLinha} textAnchor="middle" fontFamily="Arial" fontWeight="bold">{c.label}</text>}
      </g>
    )
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '8px' }}>
      <svg viewBox={'0 0 ' + totalW + ' ' + totalH} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', minWidth: totalW + 'px', display: 'block' }}>
        <rect x="0" y="0" width={totalW} height={totalH} fill="#f8fafc" rx="8"/>
        {participantes.map((p, idx) => {
          const corBg = CORES_PARTICIPANTE[idx % CORES_PARTICIPANTE.length]
          const corBorda = BORDAS_PARTICIPANTE[idx % BORDAS_PARTICIPANTE.length]
          const corTexto = TEXTO_PARTICIPANTE[idx % TEXTO_PARTICIPANTE.length]
          const y = PADDING_TOP + idx * RAIA_H
          return (
            <g key={p}>
              <rect x="4" y={y} width={totalW - 8} height={RAIA_H} fill={corBg} rx="4" stroke={corBorda} strokeWidth="1"/>
              <text x="22" y={y + RAIA_H / 2 + 4} fontSize="11" fill={corTexto} fontFamily="Arial" fontWeight="bold" transform={'rotate(-90, 22, ' + (y + RAIA_H / 2) + ')'}>{p}</text>
            </g>
          )
        })}
        {conexoes.map((c, i) => renderConexao(c, i))}
        {elementos.map(el => renderElemento(el))}
        <g transform={'translate(10, ' + (totalH - 22) + ')'}>
          <circle cx="8" cy="8" r="6" fill="#4338CA"/>
          <text x="18" y="12" fontSize="9" fill="#64748b" fontFamily="Arial">Inicio</text>
          <circle cx="60" cy="8" r="6" fill="#991b1b"/>
          <text x="70" y="12" fontSize="9" fill="#64748b" fontFamily="Arial">Fim</text>
          <rect x="108" y="2" width="24" height="12" rx="3" fill="white" stroke="#CBD5E1" strokeWidth="1"/>
          <text x="136" y="12" fontSize="9" fill="#64748b" fontFamily="Arial">Atividade</text>
          <polygon points="188,8 200,2 212,8 200,14" fill="white" stroke="#94a3b8" strokeWidth="1"/>
          <text x="218" y="12" fontSize="9" fill="#64748b" fontFamily="Arial">Gateway</text>
        </g>
      </svg>
    </div>
  )
}

export default function BPMN() {
  const [descricao, setDescricao] = useState('')
  const [gerando, setGerando] = useState(false)
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  async function gerarBPMN() {
    if (!descricao.trim()) return alert('Descreva o processo')
    setGerando(true)
    setErro('')
    setDados(null)
    const res = await fetch('/api/bpmn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao })
    })
    const data = await res.json()
    if (data.erro) {
      setErro(data.erro)
    } else {
      setDados(data)
    }
    setGerando(false)
  }

  function exportarBizagi() {
    if (!dados) return

    const processId = 'processo_1'

    // Monta lanes (raias) por participante
    const lanes = dados.participantes.map((p, i) => {
      const elementosDaLane = dados.elementos
        .filter(el => el.participante === p)
        .map(el => `        <flowNodeRef>${el.id}</flowNodeRef>`)
        .join('\n')
      return `      <lane id="lane_${i}" name="${p}">
${elementosDaLane}
      </lane>`
    }).join('\n')

    // Monta elementos BPMN
    const elementos = dados.elementos.map(el => {
      if (el.tipo === 'inicio') return `    <startEvent id="${el.id}" name="${el.nome}"/>`
      if (el.tipo === 'fim') return `    <endEvent id="${el.id}" name="${el.nome}"/>`
      if (el.tipo === 'gateway') return `    <exclusiveGateway id="${el.id}" name="${el.nome}" gatewayDirection="Diverging"/>`
      return `    <task id="${el.id}" name="${el.nome}"/>`
    }).join('\n')

    // Monta conexoes (sequenceFlow)
    const conexoes = dados.conexoes.map((c, i) => {
      const label = c.label ? ` name="${c.label}"` : ''
      return `    <sequenceFlow id="flow_${i}" sourceRef="${c.de}" targetRef="${c.para}"${label}/>`
    }).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
             typeLanguage="http://www.w3.org/2001/XMLSchema"
             expressionLanguage="http://www.w3.org/1999/XPath"
             targetNamespace="http://www.activiti.org/test">

  <collaboration id="colaboracao_1">
    <participant id="participante_1" name="${dados.nome}" processRef="${processId}"/>
  </collaboration>

  <process id="${processId}" name="${dados.nome}" isExecutable="true">
    <laneSet id="laneSet_1">
${lanes}
    </laneSet>
${elementos}
${conexoes}
  </process>

</definitions>`

    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const nomeArquivo = dados.nome.replace(/\s+/g, '_') + '.bpmn'
    a.download = nomeArquivo
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px' }}>Sistema de Melhoria</p>
            <h1 style={{ color: '#1e293b', margin: 0, fontSize: '24px' }}>🔷 Modelagem BPMN</h1>
          </div>
          <a href="/" style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', color: '#475569', fontSize: '13px' }}>Inicio</a>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <h2 style={{ color: '#1e293b', fontSize: '15px', margin: '0 0 6px' }}>Descreva o processo</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 14px' }}>Conte como o processo funciona — quem participa, quais etapas, quais decisoes. A IA vai criar o diagrama BPMN automaticamente.</p>
          <textarea
            placeholder="Ex: O cliente envia uma solicitacao de compra. O financeiro verifica o limite de credito. Se aprovado, o estoque separa os itens e faz o envio. Se negado, o cliente e notificado por email e pode solicitar revisao..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box', resize: 'vertical', color: '#1e293b', fontFamily: 'Arial' }}
          />
          <button
            onClick={gerarBPMN}
            disabled={gerando}
            style={{ padding: '12px 24px', background: gerando ? '#a5b4fc' : '#534AB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: gerando ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {gerando ? 'Gerando diagrama...' : '✨ Gerar diagrama BPMN'}
          </button>
        </div>

        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>Erro: {erro}</p>
          </div>
        )}

        {dados && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: '#1e293b', fontSize: '16px', margin: 0 }}>{dados.nome}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {dados.participantes && dados.participantes.map((p, i) => (
                  <span key={i} style={{ fontSize: '12px', background: CORES_PARTICIPANTE[i % CORES_PARTICIPANTE.length], color: TEXTO_PARTICIPANTE[i % TEXTO_PARTICIPANTE.length], padding: '3px 10px', borderRadius: '20px', border: '1px solid ' + BORDAS_PARTICIPANTE[i % BORDAS_PARTICIPANTE.length] }}>{p}</span>
                ))}
              </div>
            </div>
            <DiagramaBPMN dados={dados} />
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setDados(null); setDescricao('') }}
                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                Novo processo
              </button>
              <button
                onClick={gerarBPMN}
                style={{ padding: '8px 16px', background: '#EEEDFE', color: '#534AB7', border: '1px solid #CECBF6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                ✨ Regerar
              </button>
              <button
                onClick={exportarBizagi}
                style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ⬇️ Exportar para Bizagi (.bpmn)
              </button>
            </div>
          </div>
        )}

        {!dados && !gerando && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔷</div>
            <p style={{ color: '#1e293b', fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px' }}>Como usar</p>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>Descreva o processo em linguagem natural. Mencione os participantes, as etapas e as decisoes. Quanto mais detalhado, melhor o diagrama.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Processo de compras com aprovacao', 'Atendimento ao cliente com escalonamento', 'Processo de contratacao de funcionarios', 'Fluxo de aprovacao de mudancas de TI'].map((ex, i) => (
                <button key={i} onClick={() => setDescricao(ex)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: '#EEEDFE', color: '#534AB7', border: '1px solid #CECBF6', cursor: 'pointer' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}