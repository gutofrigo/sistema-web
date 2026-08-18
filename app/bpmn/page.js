'use client'
import { useState } from 'react'
import { Workflow, Sparkles, Download } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

const CORES_PARTICIPANTE = ['#EEF2FF', '#F0FDF4', '#FFF7ED', '#FDF2F8', '#F0F9FF', '#FFFBEB']
const BORDAS_PARTICIPANTE = ['#C7D2FE', '#BBF7D0', '#FED7AA', '#FBCFE8', '#BAE6FD', '#FDE68A']
const TEXTO_PARTICIPANTE = ['#3730A3', '#166534', '#9A3412', '#9D174D', '#075985', '#92400E']

const RAIA_H_BASE = 110
const PADDING_TOP = 20
const PADDING_LEFT = 50
const ELEM_W = 130
const ELEM_H = 50
const COL_W = 170
const STACK_STEP = 62
const LEGENDA_H = 34
const FAIXA_LOOP = 30

// Quebra um nome em ate 2 linhas para caber na largura do elemento
function quebrarNome(nome, maxCharsPorLinha) {
  const palavras = String(nome || '').split(' ')
  const linhas = []
  let atual = ''
  for (const p of palavras) {
    const tentativa = atual ? atual + ' ' + p : p
    if (tentativa.length > maxCharsPorLinha && atual) {
      linhas.push(atual)
      atual = p
      if (linhas.length === 2) break
    } else {
      atual = tentativa
    }
  }
  if (linhas.length < 2 && atual) linhas.push(atual)
  if (linhas.length > 2) linhas.length = 2
  if (linhas[1] && linhas[1].length > maxCharsPorLinha) linhas[1] = linhas[1].substring(0, maxCharsPorLinha - 1) + '…'
  return linhas
}

// Calcula posicoes do diagrama: colunas pelo caminho mais longo (ignorando arestas de retorno,
// que vao para "loop"), e empilhamento vertical quando mais de um elemento cai na mesma raia+coluna.
function calcularLayout(dados) {
  const participantes = dados.participantes || []
  const elementos = dados.elementos || []
  const idsValidos = new Set(elementos.map(e => e.id))
  const conexoes = (dados.conexoes || []).filter(c => idsValidos.has(c.de) && idsValidos.has(c.para))

  // 1) Deteccao de arestas de retorno (loop) via DFS, para nao distorcer o calculo de colunas
  const adjTudo = new Map()
  elementos.forEach(e => adjTudo.set(e.id, []))
  conexoes.forEach(c => adjTudo.get(c.de).push(c))
  const estado = new Map(elementos.map(e => [e.id, 0])) // 0 nao visitado, 1 na pilha, 2 concluido
  const arestasLoop = new Set()
  function dfs(id) {
    estado.set(id, 1)
    adjTudo.get(id).forEach(c => {
      const st = estado.get(c.para)
      if (st === 1) arestasLoop.add(c)
      else if (st === 0) dfs(c.para)
    })
    estado.set(id, 2)
  }
  const inicioEl = elementos.find(e => e.tipo === 'inicio') || elementos[0]
  if (inicioEl) dfs(inicioEl.id)
  elementos.forEach(e => { if (estado.get(e.id) === 0) dfs(e.id) })

  // 2) Camadas (coluna) pelo caminho mais longo, ignorando arestas de loop
  const adjDAG = new Map()
  const grauEntrada = new Map()
  elementos.forEach(e => { adjDAG.set(e.id, []); grauEntrada.set(e.id, 0) })
  conexoes.forEach(c => {
    if (arestasLoop.has(c)) return
    adjDAG.get(c.de).push(c.para)
    grauEntrada.set(c.para, grauEntrada.get(c.para) + 1)
  })
  const coluna = new Map(elementos.map(e => [e.id, 0]))
  const grauRestante = new Map(grauEntrada)
  const fila = elementos.filter(e => grauEntrada.get(e.id) === 0).map(e => e.id)
  while (fila.length > 0) {
    const id = fila.shift()
    adjDAG.get(id).forEach(destino => {
      coluna.set(destino, Math.max(coluna.get(destino), coluna.get(id) + 1))
      grauRestante.set(destino, grauRestante.get(destino) - 1)
      if (grauRestante.get(destino) === 0) fila.push(destino)
    })
  }

  // 3) Agrupa por raia+coluna para empilhar elementos concorrentes no mesmo lugar
  const grupos = {} // participante -> { coluna: [ids] }
  elementos.forEach(el => {
    const p = el.participante
    const c = coluna.get(el.id)
    if (!grupos[p]) grupos[p] = {}
    if (!grupos[p][c]) grupos[p][c] = []
    grupos[p][c].push(el.id)
  })

  // 4) Altura de cada raia depende do maior empilhamento que ela contem
  const laneHeight = {}
  const laneY = {}
  let acc = PADDING_TOP
  participantes.forEach(p => {
    const porColuna = grupos[p] || {}
    const maxStack = Object.values(porColuna).reduce((m, ids) => Math.max(m, ids.length), 1)
    laneHeight[p] = Math.max(RAIA_H_BASE, 40 + maxStack * STACK_STEP)
    laneY[p] = acc
    acc += laneHeight[p]
  })
  const temLoop = arestasLoop.size > 0
  const totalH = acc + (temLoop ? FAIXA_LOOP : 0) + LEGENDA_H

  // 5) Posicao final de cada elemento (com offset de empilhamento dentro da raia)
  const posicoes = {}
  elementos.forEach(el => {
    const p = el.participante
    const c = coluna.get(el.id)
    const grupo = (grupos[p] && grupos[p][c]) || [el.id]
    const idx = grupo.indexOf(el.id)
    const count = grupo.length
    const centerY = (laneY[p] !== undefined ? laneY[p] : PADDING_TOP) + (laneHeight[p] || RAIA_H_BASE) / 2
    posicoes[el.id] = {
      x: PADDING_LEFT + 80 + coluna.get(el.id) * COL_W,
      y: centerY + (idx - (count - 1) / 2) * STACK_STEP
    }
  })

  const maxCol = elementos.length > 0 ? Math.max(...elementos.map(e => coluna.get(e.id))) : 0
  const totalW = Math.max(680, PADDING_LEFT + 80 + (maxCol + 1) * COL_W + 60)
  const faixaLoopY = acc + FAIXA_LOOP / 2

  return { participantes, elementos, conexoes, posicoes, laneY, laneHeight, totalW, totalH, arestasLoop, faixaLoopY, acimaLegenda: acc + (temLoop ? FAIXA_LOOP : 0) }
}

function DiagramaBPMN({ dados }) {
  if (!dados || !dados.elementos) return null
  const layout = calcularLayout(dados)
  const { participantes, elementos, conexoes, posicoes, laneY, laneHeight, totalW, totalH, arestasLoop, faixaLoopY } = layout

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
    const linhas = quebrarNome(el.nome, 20)
    return (
      <g key={el.id}>
        <rect x={x - ELEM_W / 2} y={y - ELEM_H / 2} width={ELEM_W} height={ELEM_H} rx="6" fill="white" stroke={C.borda} strokeWidth="1.5"/>
        {linhas.length === 1 ? (
          <text x={x} y={y - 3} fontSize="9" fill={C.texto} textAnchor="middle" fontFamily="Arial">{linhas[0]}</text>
        ) : (
          <>
            <text x={x} y={y - 11} fontSize="9" fill={C.texto} textAnchor="middle" fontFamily="Arial">{linhas[0]}</text>
            <text x={x} y={y - 1} fontSize="9" fill={C.texto} textAnchor="middle" fontFamily="Arial">{linhas[1]}</text>
          </>
        )}
        <text x={x} y={y + 16} fontSize="8" fill={C.textoMudo} textAnchor="middle" fontFamily="Arial">{el.participante}</text>
      </g>
    )
  }

  let loopContador = 0
  const loopIndices = new Map()
  conexoes.forEach(c => { if (arestasLoop.has(c)) { loopIndices.set(c, loopContador); loopContador++ } })

  function renderConexao(c, idx) {
    const origem = posicoes[c.de]
    const destino = posicoes[c.para]
    if (!origem || !destino) return null
    const elOrigem = elementos.find(e => e.id === c.de)
    const elDestino = elementos.find(e => e.id === c.para)
    const corLinha = c.label === 'Sim' || c.label === 'sim' ? C.verde : c.label === 'Nao' || c.label === 'nao' ? C.vermelho : C.borda

    if (arestasLoop.has(c)) {
      const x1 = origem.x
      const y1 = origem.y + ELEM_H / 2
      const x2 = destino.x
      const y2 = destino.y + ELEM_H / 2
      const yCanal = faixaLoopY + loopIndices.get(c) * 8
      const d = 'M ' + x1 + ' ' + y1 + ' L ' + x1 + ' ' + yCanal + ' L ' + x2 + ' ' + yCanal + ' L ' + x2 + ' ' + y2
      return (
        <g key={idx}>
          <defs>
            <marker id={'arrloop' + idx} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={C.royal}/>
            </marker>
          </defs>
          <path d={d} fill="none" stroke={C.royal} strokeWidth="1.5" strokeDasharray="4 3" markerEnd={'url(#arrloop' + idx + ')'} />
          {c.label && <text x={(x1 + x2) / 2} y={yCanal - 5} fontSize="9" fill={C.royal} textAnchor="middle" fontFamily="Arial" fontWeight="bold">{c.label}</text>}
        </g>
      )
    }

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
          const y = laneY[p]
          const h = laneHeight[p]
          return (
            <g key={p}>
              <rect x="4" y={y} width={totalW - 8} height={h} fill={corBg} rx="4" stroke={corBorda} strokeWidth="1"/>
              <text x="22" y={y + h / 2 + 4} fontSize="11" fill={corTexto} fontFamily="Arial" fontWeight="bold" transform={'rotate(-90, 22, ' + (y + h / 2) + ')'}>{p}</text>
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

    const PX = 96
    const layout = calcularLayout(dados)
    const { participantes, elementos, conexoes, posicoes, laneY, laneHeight, totalW, totalH } = layout

    const f = v => (v / PX).toFixed(4)
    const fy = y => ((totalH - y) / PX).toFixed(4)
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    let nextId = 1
    const shapeMap = {}

    const lanesXml = participantes.map((p) => {
      const id = nextId++
      const cx = totalW / 2
      const cy = laneY[p] + laneHeight[p] / 2
      const w = (totalW / PX).toFixed(4)
      const h = (laneHeight[p] / PX).toFixed(4)
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

        <div style={{ background: C.branco, borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, marginBottom: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
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
          <div style={{ background: C.branco, borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: dados.metodologia ? '8px' : '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ color: C.texto, fontSize: '15px', margin: 0, fontWeight: 'bold' }}>{dados.nome}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {dados.participantes && dados.participantes.map((p, i) => (
                  <span key={i} style={{ fontSize: '12px', background: CORES_PARTICIPANTE[i % CORES_PARTICIPANTE.length], color: TEXTO_PARTICIPANTE[i % TEXTO_PARTICIPANTE.length], padding: '3px 10px', borderRadius: '20px', border: '1px solid ' + BORDAS_PARTICIPANTE[i % BORDAS_PARTICIPANTE.length] }}>{p}</span>
                ))}
              </div>
            </div>
            {dados.metodologia && (
              <p style={{ fontSize: '12px', color: C.textoSec, background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '6px', padding: '8px 12px', margin: '0 0 16px', lineHeight: '1.5' }}>
                <strong style={{ color: C.royal }}>Metodologia aplicada:</strong> {dados.metodologia}
              </p>
            )}
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
          <div style={{ background: C.branco, borderRadius: '10px', padding: '32px', border: `1px solid ${C.borda}`, textAlign: 'center', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
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
