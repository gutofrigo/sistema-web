'use client'
import { useState } from 'react'
import { Workflow, Sparkles, Download } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

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
          <circle cx={x} cy={y} r={16} fill="white" stroke={C.royal} strokeWidth="2"/>
          <circle cx={x} cy={y} r={10} fill={C.royal}/>
          <text x={x} y={y + 28} fontSize="9" fill={C.textoMudo} textAnchor="middle" fontFamily="Arial">{el.nome}</text>
        </g>
      )
    }
    if (el.tipo === 'fim') {
      return (
        <g key={el.id}>
          <circle cx={x} cy={y} r={16} fill="white" stroke={C.vermelho} strokeWidth="3"/>
          <circle cx={x} cy={y} r={10} fill={C.vermelho}/>
          <text x={x} y={y + 28} fontSize="9" fill={C.textoMudo} textAnchor="middle" fontFamily="Arial">{el.nome}</text>
        </g>
      )
    }
    if (el.tipo === 'gateway') {
      return (
        <g key={el.id}>
          <polygon points={x + ',' + (y - 18) + ' ' + (x + 20) + ',' + y + ' ' + x + ',' + (y + 18) + ' ' + (x - 20) + ',' + y} fill="white" stroke={C.borda} strokeWidth="1.5"/>
          <text x={x} y={y + 4} fontSize="11" fill={C.textoSec} textAnchor="middle" fontFamily="Arial" fontWeight="bold">?</text>
          <text x={x} y={y + 32} fontSize="9" fill={C.textoMudo} textAnchor="middle" fontFamily="Arial">{el.nome}</text>
        </g>
      )
    }
    return (
      <g key={el.id}>
        <rect x={x - ELEM_W / 2} y={y - ELEM_H / 2} width={ELEM_W} height={ELEM_H} rx="6" fill="white" stroke={C.borda} strokeWidth="1.5"/>
        <text x={x} y={y - 4} fontSize="9" fill={C.texto} textAnchor="middle" fontFamily="Arial">{el.nome.length > 14 ? el.nome.substring(0, 14) + '...' : el.nome}</text>
        <text x={x} y={y + 8} fontSize="8" fill={C.textoMudo} textAnchor="middle" fontFamily="Arial">{el.participante}</text>
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
    const corLinha = c.label === 'Sim' || c.label === 'sim' ? C.verde : c.label === 'Nao' || c.label === 'nao' ? C.vermelho : C.borda
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
        <rect x="0" y="0" width={totalW} height={totalH} fill={C.fundo} rx="6"/>
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
          <circle cx="8" cy="8" r="6" fill={C.royal}/>
          <text x="18" y="12" fontSize="9" fill={C.textoMudo} fontFamily="Arial">Inicio</text>
          <circle cx="60" cy="8" r="6" fill={C.vermelho}/>
          <text x="70" y="12" fontSize="9" fill={C.textoMudo} fontFamily="Arial">Fim</text>
          <rect x="108" y="2" width="24" height="12" rx="3" fill="white" stroke={C.borda} strokeWidth="1"/>
          <text x="136" y="12" fontSize="9" fill={C.textoMudo} fontFamily="Arial">Atividade</text>
          <polygon points="188,8 200,2 212,8 200,14" fill="white" stroke={C.borda} strokeWidth="1"/>
          <text x="218" y="12" fontSize="9" fill={C.textoMudo} fontFamily="Arial">Gateway</text>
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

  function exportarVisio() {
    if (!dados) return

    const RAIA_H = 110
    const PADDING_TOP = 20
    const PADDING_LEFT = 50
    const ELEM_W = 100
    const ELEM_H = 40
    const COL_W = 140
    const PX = 96

    const participantes = dados.participantes || []
    const elementos = dados.elementos || []
    const conexoes = dados.conexoes || []

    const colunaGlobal = {}
    const vis = new Set()
    function calcCols(id, col) {
      if (vis.has(id)) return
      vis.add(id)
      colunaGlobal[id] = Math.max(colunaGlobal[id] || 0, col)
      conexoes.filter(c => c.de === id).forEach(c => calcCols(c.para, col + 1))
    }
    const elInicio = elementos.find(e => e.tipo === 'inicio')
    if (elInicio) calcCols(elInicio.id, 0)
    elementos.forEach(el => { if (colunaGlobal[el.id] === undefined) colunaGlobal[el.id] = 0 })

    const maxCol = Math.max(...Object.values(colunaGlobal), 0)
    const totalW = Math.max(680, PADDING_LEFT + 80 + (maxCol + 1) * COL_W + 60)
    const totalH = participantes.length * RAIA_H + PADDING_TOP

    const posicoes = {}
    elementos.forEach(el => {
      const idx = participantes.indexOf(el.participante)
      posicoes[el.id] = {
        x: PADDING_LEFT + 80 + colunaGlobal[el.id] * COL_W,
        y: PADDING_TOP + idx * RAIA_H + RAIA_H / 2
      }
    })

    const f = v => (v / PX).toFixed(4)
    const fy = y => ((totalH - y) / PX).toFixed(4)
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    let nextId = 1
    const shapeMap = {}

    const lanesXml = participantes.map((p, idx) => {
      const id = nextId++
      const cx = totalW / 2
      const cy = PADDING_TOP + idx * RAIA_H + RAIA_H / 2
      const w = (totalW / PX).toFixed(4)
      const h = (RAIA_H / PX).toFixed(4)
      return `        <Shape ID="${id}" Type="Shape">
          <XForm><PinX>${f(cx)}</PinX><PinY>${fy(cy)}</PinY><Width>${w}</Width><Height>${h}</Height><LocPinX>Width*0.5</LocPinX><LocPinY>Height*0.5</LocPinY></XForm>
          <Fill><FillForegnd>#EEF2FF</FillForegnd></Fill>
          <Line><LineColor>#C7D2FE</LineColor></Line>
          <Geom IX="0">
            <MoveTo IX="1"><X>0</X><Y>0</Y></MoveTo>
            <LineTo IX="2"><X>${w}</X><Y>0</Y></LineTo>
            <LineTo IX="3"><X>${w}</X><Y>${h}</Y></LineTo>
            <LineTo IX="4"><X>0</X><Y>${h}</Y></LineTo>
            <LineTo IX="5"><X>0</X><Y>0</Y></LineTo>
          </Geom>
          <Text>${esc(p)}</Text>
        </Shape>`
    }).join('\n')

    const elementsXml = elementos.map(el => {
      const id = nextId++
      shapeMap[el.id] = id
      const pos = posicoes[el.id]
      const name = esc(el.nome)

      if (el.tipo === 'inicio' || el.tipo === 'fim') {
        const r = 16 / PX
        const d = (r * 2).toFixed(4)
        const color = el.tipo === 'inicio' ? '#1E5BC6' : '#DC2626'
        const pts = Array.from({ length: 9 }, (_, i) => {
          const a = (i / 8) * 2 * Math.PI
          const px = (r + r * Math.cos(a)).toFixed(4)
          const py = (r + r * Math.sin(a)).toFixed(4)
          return i === 0
            ? `<MoveTo IX="1"><X>${px}</X><Y>${py}</Y></MoveTo>`
            : `<LineTo IX="${i + 1}"><X>${px}</X><Y>${py}</Y></LineTo>`
        }).join('\n            ')
        return `        <Shape ID="${id}" Type="Shape">
          <XForm><PinX>${f(pos.x)}</PinX><PinY>${fy(pos.y)}</PinY><Width>${d}</Width><Height>${d}</Height><LocPinX>Width*0.5</LocPinX><LocPinY>Height*0.5</LocPinY></XForm>
          <Fill><FillForegnd>${color}</FillForegnd></Fill>
          <Geom IX="0">
            ${pts}
          </Geom>
          <Text>${name}</Text>
        </Shape>`
      }

      if (el.tipo === 'gateway') {
        const w = (40 / PX).toFixed(4)
        const h = (36 / PX).toFixed(4)
        const hw = (20 / PX).toFixed(4)
        const hh = (18 / PX).toFixed(4)
        return `        <Shape ID="${id}" Type="Shape">
          <XForm><PinX>${f(pos.x)}</PinX><PinY>${fy(pos.y)}</PinY><Width>${w}</Width><Height>${h}</Height><LocPinX>Width*0.5</LocPinX><LocPinY>Height*0.5</LocPinY></XForm>
          <Geom IX="0">
            <MoveTo IX="1"><X>${hw}</X><Y>0</Y></MoveTo>
            <LineTo IX="2"><X>${w}</X><Y>${hh}</Y></LineTo>
            <LineTo IX="3"><X>${hw}</X><Y>${h}</Y></LineTo>
            <LineTo IX="4"><X>0</X><Y>${hh}</Y></LineTo>
            <LineTo IX="5"><X>${hw}</X><Y>0</Y></LineTo>
          </Geom>
          <Text>${name}</Text>
        </Shape>`
      }

      const w = (ELEM_W / PX).toFixed(4)
      const h = (ELEM_H / PX).toFixed(4)
      return `        <Shape ID="${id}" Type="Shape">
          <XForm><PinX>${f(pos.x)}</PinX><PinY>${fy(pos.y)}</PinY><Width>${w}</Width><Height>${h}</Height><LocPinX>Width*0.5</LocPinX><LocPinY>Height*0.5</LocPinY></XForm>
          <Geom IX="0">
            <MoveTo IX="1"><X>0</X><Y>0</Y></MoveTo>
            <LineTo IX="2"><X>${w}</X><Y>0</Y></LineTo>
            <LineTo IX="3"><X>${w}</X><Y>${h}</Y></LineTo>
            <LineTo IX="4"><X>0</X><Y>${h}</Y></LineTo>
            <LineTo IX="5"><X>0</X><Y>0</Y></LineTo>
          </Geom>
          <Text>${name}</Text>
        </Shape>`
    }).join('\n')

    const connShapes = []
    const connConnects = []
    conexoes.forEach(c => {
      const fromId = shapeMap[c.de]
      const toId = shapeMap[c.para]
      if (!fromId || !toId) return
      const connId = nextId++
      connShapes.push(`        <Shape ID="${connId}" Type="Edge">${c.label ? `<Text>${esc(c.label)}</Text>` : ''}</Shape>`)
      connConnects.push(`        <Connect FromSheet="${connId}" FromCell="BeginX" ToSheet="${fromId}" ToCell="PinX"/>`)
      connConnects.push(`        <Connect FromSheet="${connId}" FromCell="EndX" ToSheet="${toId}" ToCell="PinX"/>`)
    })

    const vdx = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<VisioDocument xmlns="urn:schemas-microsoft-com:office:visio" xml:space="preserve">
  <DocumentProperties>
    <Title>${esc(dados.nome)}</Title>
    <Creator>Sistema de Melhoria</Creator>
  </DocumentProperties>
  <Pages>
    <Page ID="1" Name="${esc(dados.nome)}">
      <PageSheet>
        <PageProps>
          <PageWidth>${(totalW / PX).toFixed(4)}</PageWidth>
          <PageHeight>${(totalH / PX).toFixed(4)}</PageHeight>
          <PageScale>1</PageScale>
          <DrawingScale>1</DrawingScale>
        </PageProps>
      </PageSheet>
      <Shapes>
${lanesXml}
${elementsXml}
${connShapes.join('\n')}
      </Shapes>
      <Connects>
${connConnects.join('\n')}
      </Connects>
    </Page>
  </Pages>
</VisioDocument>`

    const blob = new Blob([vdx], { type: 'application/vnd.ms-visio.drawing' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = dados.nome.replace(/\s+/g, '_') + '.vdx'
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportarBizagi() {
    if (!dados) return
    const processId = 'processo_1'
    const lanes = dados.participantes.map((p, i) => {
      const elementosDaLane = dados.elementos
        .filter(el => el.participante === p)
        .map(el => `        <flowNodeRef>${el.id}</flowNodeRef>`)
        .join('\n')
      return `      <lane id="lane_${i}" name="${p}">
${elementosDaLane}
      </lane>`
    }).join('\n')
    const elementos = dados.elementos.map(el => {
      if (el.tipo === 'inicio') return `    <startEvent id="${el.id}" name="${el.nome}"/>`
      if (el.tipo === 'fim') return `    <endEvent id="${el.id}" name="${el.nome}"/>`
      if (el.tipo === 'gateway') return `    <exclusiveGateway id="${el.id}" name="${el.nome}" gatewayDirection="Diverging"/>`
      return `    <task id="${el.id}" name="${el.nome}"/>`
    }).join('\n')
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
    a.download = dados.nome.replace(/\s+/g, '_') + '.bpmn'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell title="Modelagem BPMN" subtitle="Sistema de Melhoria">
      {/* Content */}
      <div className="page-pad" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, marginBottom: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: C.texto, fontSize: '15px', margin: '0 0 6px', fontWeight: 'bold' }}>Descreva o processo</h2>
          <p style={{ color: C.textoSec, fontSize: '13px', margin: '0 0 14px' }}>Conte como o processo funciona — quem participa, quais etapas, quais decisoes. A IA vai criar o diagrama BPMN automaticamente.</p>
          <textarea
            placeholder="Ex: O cliente envia uma solicitacao de compra. O financeiro verifica o limite de credito. Se aprovado, o estoque separa os itens e faz o envio. Se negado, o cliente e notificado por email e pode solicitar revisao..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box', resize: 'vertical', color: C.texto, fontFamily: 'var(--font-nunito), Arial, sans-serif' }}
          />
          <button
            onClick={gerarBPMN}
            disabled={gerando}
            style={{ padding: '11px 24px', background: gerando ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: gerando ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={15} /> {gerando ? 'Gerando diagrama...' : 'Gerar diagrama BPMN'}
          </button>
        </div>

        {erro && (
          <div style={{ background: '#fef2f2', border: `1px solid #fca5a5`, borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ color: C.vermelho, fontSize: '13px', margin: 0 }}>Erro: {erro}</p>
          </div>
        )}

        {dados && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ color: C.texto, fontSize: '15px', margin: 0, fontWeight: 'bold' }}>{dados.nome}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {dados.participantes && dados.participantes.map((p, i) => (
                  <span key={i} style={{ fontSize: '12px', background: CORES_PARTICIPANTE[i % CORES_PARTICIPANTE.length], color: TEXTO_PARTICIPANTE[i % TEXTO_PARTICIPANTE.length], padding: '3px 10px', borderRadius: '20px', border: '1px solid ' + BORDAS_PARTICIPANTE[i % BORDAS_PARTICIPANTE.length] }}>{p}</span>
                ))}
              </div>
            </div>
            <DiagramaBPMN dados={dados} />
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => { setDados(null); setDescricao('') }} style={{ padding: '8px 16px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Novo processo
              </button>
              <button onClick={gerarBPMN} style={{ padding: '8px 16px', background: '#EEF2FF', color: C.royal, border: `1px solid ${C.borda}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} /> Regerar
              </button>
              <button onClick={exportarBizagi} style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={13} /> Exportar para Bizagi (.bpmn)
              </button>
              <button onClick={exportarVisio} style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={13} /> Exportar para Visio (.vdx)
              </button>
            </div>
          </div>
        )}

        {!dados && !gerando && (
          <div style={{ background: 'white', borderRadius: '10px', padding: '32px', border: `1px solid ${C.borda}`, textAlign: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
            <Workflow size={40} color={C.royal} style={{ marginBottom: '12px' }} />
            <p style={{ color: C.texto, fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px' }}>Como usar</p>
            <p style={{ color: C.textoSec, fontSize: '13px', margin: '0 0 16px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>Descreva o processo em linguagem natural. Mencione os participantes, as etapas e as decisoes. Quanto mais detalhado, melhor o diagrama.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Processo de compras com aprovacao', 'Atendimento ao cliente com escalonamento', 'Processo de contratacao de funcionarios', 'Fluxo de aprovacao de mudancas de TI'].map((ex, i) => (
                <button key={i} onClick={() => setDescricao(ex)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: '#EEF2FF', color: C.royal, border: `1px solid ${C.borda}`, cursor: 'pointer', fontWeight: 'bold' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
