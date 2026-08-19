'use client'
import { useState, useEffect, Fragment } from 'react'
import { GanttChartSquare, AlertTriangle, Pencil, Sparkles, Plus, Trash2, User, Wallet, Upload, Download, ChevronRight, ChevronDown, ListChecks, Calendar, Wand2 } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

const PESO_PROBABILIDADE = { baixa: 1, media: 2, alta: 3 }
const PESO_IMPACTO = { baixo: 1, medio: 2, alto: 3 }
function corScore(score) {
  if (score >= 6) return C.vermelho
  if (score >= 3) return C.ambar
  return C.verde
}

const coresStatus = { pendente: C.ambar, em_andamento: C.statusInfo, concluido: C.verde }
const coresImpacto = { baixo: C.verde, medio: C.ambar, alto: C.vermelho }

function statusPortfolio(p) {
  const hoje = new Date()
  const atrasado = !!p.data_prevista_fim && p.status !== 'concluido' && new Date(p.data_prevista_fim + 'T23:59:59') < hoje
  if (p.status === 'concluido') return { chave: 'concluido', label: 'Concluido', cor: C.verde, bg: '#F0FDF4' }
  if (atrasado) return { chave: 'atrasado', label: 'Atrasado', cor: C.vermelho, bg: '#FEF2F2' }
  if (p.em_risco) return { chave: 'em_risco', label: 'Em risco', cor: C.ambar, bg: '#FFFBEB' }
  if (p.status === 'em_andamento') return { chave: 'no_prazo', label: 'No prazo', cor: C.statusInfo, bg: '#EFF6FF' }
  return { chave: 'planejado', label: 'Planejado', cor: C.textoMudo, bg: '#F3F4F6' }
}

function formatarMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function parseCSV(texto) {
  const linhas = texto.split(/\r\n|\n|\r/).filter(l => l.trim() !== '')
  if (linhas.length < 2) return []
  const qtdVirgulas = (linhas[0].match(/,/g) || []).length
  const qtdPontoVirgulas = (linhas[0].match(/;/g) || []).length
  const delimitador = qtdPontoVirgulas > qtdVirgulas ? ';' : ','
  function parseLinha(linha) {
    const campos = []
    let atual = ''
    let dentroAspas = false
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i]
      if (c === '"') {
        if (dentroAspas && linha[i + 1] === '"') { atual += '"'; i++ }
        else dentroAspas = !dentroAspas
      } else if (c === delimitador && !dentroAspas) {
        campos.push(atual); atual = ''
      } else {
        atual += c
      }
    }
    campos.push(atual)
    return campos.map(c => c.trim())
  }
  const cabecalho = parseLinha(linhas[0]).map(h => h.toLowerCase().trim())
  return linhas.slice(1).map(linha => {
    const valores = parseLinha(linha)
    const obj = {}
    cabecalho.forEach((h, i) => { obj[h] = valores[i] || '' })
    return obj
  })
}

export default function Projetos() {
  const [tela, setTela] = useState('lista')
  const [projetos, setProjetos] = useState([])
  const [projetoAtivo, setProjetoAtivo] = useState(null)
  const [tarefas, setTarefas] = useState([])
  const [riscos, setRiscos] = useState([])
  const [roadmapVinculado, setRoadmapVinculado] = useState(null)
  const [novoProj, setNovoProj] = useState({ titulo: '', responsavel: '', descricao: '', orcamento: '', data_prevista_fim: '', prioridade: 'media', area: '' })
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', responsavel: '', data_inicio: '', data_entrega: '', status: 'pendente', tarefa_pai_id: '' })
  const [novoRisco, setNovoRisco] = useState({ descricao: '', categoria: '', probabilidade: 'media', impacto: 'medio', mitigacao: '', responsavel: '' })
  const [editProj, setEditProj] = useState({ titulo: '', descricao: '', responsavel: '', orcamento: '', data_prevista_fim: '', prioridade: 'media', area: '', progresso: 0, em_risco: false })
  const [mostrarFormTarefa, setMostrarFormTarefa] = useState(false)
  const [mostrarGerador, setMostrarGerador] = useState(false)
  const [mostrarRiscos, setMostrarRiscos] = useState(false)
  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [objetivoIA, setObjetivoIA] = useState('')
  const [gerandoIA, setGerandoIA] = useState(false)
  const [tarefasIA, setTarefasIA] = useState([])
  const [selecionadas, setSelecionadas] = useState([])
  const [adicionando, setAdicionando] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [nomeArquivoCsv, setNomeArquivoCsv] = useState('')
  const [csvPreview, setCsvPreview] = useState([])
  const [csvErro, setCsvErro] = useState('')
  const [importando, setImportando] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState(null)
  const [colapsados, setColapsados] = useState(new Set())
  const [mostrarEditarTarefas, setMostrarEditarTarefas] = useState(false)
  const [edicoesTarefas, setEdicoesTarefas] = useState({})
  const [salvandoEdicoes, setSalvandoEdicoes] = useState(false)
  const [dependencias, setDependencias] = useState([])
  const [sugestoesRiscoIA, setSugestoesRiscoIA] = useState(null)
  const [detectandoRiscoIA, setDetectandoRiscoIA] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const lista = await buscarProjetos()
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id && lista) {
      const match = lista.find(p => String(p.id) === id)
      if (match) abrirProjeto(match)
    }
  }
  async function buscarProjetos() {
    const res = await fetch('/api/projetos')
    const data = await res.json()
    if (data.projetos) setProjetos(data.projetos)
    return data.projetos
  }
  async function buscarTarefas(projetoId) {
    const res = await fetch('/api/tarefas?projeto_id=' + projetoId)
    const data = await res.json()
    if (data.tarefas) setTarefas(data.tarefas)
  }
  async function buscarRiscos(projetoId) {
    const res = await fetch('/api/riscos?projeto_id=' + projetoId)
    const data = await res.json()
    if (data.riscos) setRiscos(data.riscos)
  }
  async function buscarRoadmapVinculado(projetoId) {
    const res = await fetch('/api/roadmap?projeto_id=' + projetoId)
    const data = await res.json()
    setRoadmapVinculado(data && data.id ? data : null)
  }
  async function buscarDependencias(projetoId) {
    const res = await fetch('/api/tarefas/dependencias?projeto_id=' + projetoId)
    const data = await res.json()
    setDependencias(data.dependencias || [])
  }
  async function criarProjeto() {
    if (!novoProj.titulo) return alert('Digite o titulo do projeto')
    await fetch('/api/projetos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoProj) })
    setNovoProj({ titulo: '', responsavel: '', descricao: '', orcamento: '', data_prevista_fim: '', prioridade: 'media', area: '' })
    setTela('lista')
    buscarProjetos()
  }
  function abrirEditar() {
    setEditProj({
      titulo: projetoAtivo.titulo || '',
      descricao: projetoAtivo.descricao || '',
      responsavel: projetoAtivo.responsavel || '',
      orcamento: projetoAtivo.orcamento || '',
      data_prevista_fim: projetoAtivo.data_prevista_fim || '',
      prioridade: projetoAtivo.prioridade || 'media',
      area: projetoAtivo.area || '',
      progresso: projetoAtivo.progresso || 0,
      em_risco: !!projetoAtivo.em_risco
    })
    setMostrarEditar(true)
    setMostrarGerador(false)
    setMostrarFormTarefa(false)
    setMostrarRiscos(false)
  }
  async function salvarEdicaoProjeto() {
    const res = await fetch('/api/projetos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: projetoAtivo.id, ...editProj, orcamento: editProj.orcamento ? Number(editProj.orcamento) : null, data_prevista_fim: editProj.data_prevista_fim || null })
    })
    const data = await res.json()
    if (data.projeto) {
      setProjetoAtivo(data.projeto)
      setMostrarEditar(false)
      buscarProjetos()
    }
  }
  async function criarRisco() {
    if (!novoRisco.descricao) return alert('Descreva o risco')
    await fetch('/api/riscos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...novoRisco, projeto_id: projetoAtivo.id }) })
    setNovoRisco({ descricao: '', categoria: '', probabilidade: 'media', impacto: 'medio', mitigacao: '', responsavel: '' })
    buscarRiscos(projetoAtivo.id)
  }
  async function atualizarRisco(id, campos) {
    await fetch('/api/riscos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...campos }) })
    buscarRiscos(projetoAtivo.id)
  }
  async function deletarRisco(id) {
    if (!confirm('Deletar este risco?')) return
    await fetch('/api/riscos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarRiscos(projetoAtivo.id)
  }
  async function importarRiscosRoadmap() {
    if (!roadmapVinculado) return
    await fetch('/api/riscos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importar_roadmap: true, projeto_id: projetoAtivo.id, roadmap_id: roadmapVinculado.id }) })
    buscarRiscos(projetoAtivo.id)
  }
  function lidarComArquivoCsv(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setResultadoImportacao(null)
    setCsvErro('')
    setNomeArquivoCsv(arquivo.name)
    const leitor = new FileReader()
    leitor.onload = () => {
      const linhas = parseCSV(String(leitor.result))
      if (linhas.length === 0) {
        setCsvErro('Nao foi possivel ler linhas do arquivo. Confira se a primeira linha tem os cabecalhos (titulo, responsavel, etc).')
        setCsvPreview([])
        return
      }
      if (!('titulo' in linhas[0])) {
        setCsvErro('O arquivo precisa ter uma coluna "titulo".')
        setCsvPreview([])
        return
      }
      setCsvPreview(linhas)
    }
    leitor.readAsText(arquivo, 'utf-8')
  }
  async function confirmarImportacaoCsv() {
    setImportando(true)
    const res = await fetch('/api/projetos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importar_csv: true, projetos: csvPreview })
    })
    const data = await res.json()
    setResultadoImportacao(data)
    setImportando(false)
    setCsvPreview([])
    setNomeArquivoCsv('')
    buscarProjetos()
  }
  function baixarModeloCsv() {
    const modelo = 'titulo,responsavel,descricao,orcamento,data_prevista_fim,prioridade,status,area,progresso,em_risco\n' +
      'Migracao para nuvem AWS,Carlos Mendes,Migrar infraestrutura para AWS,180000,2026-12-31,alta,em_andamento,Infraestrutura,25,false\n'
    const blob = new Blob([modelo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_projetos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  async function deletarProjeto(e, id) {
    e.stopPropagation()
    if (!confirm('Deletar este projeto e todas as suas tarefas?')) return
    await fetch('/api/projetos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarProjetos()
  }
  async function deletarTarefa(id) {
    if (!confirm('Deletar esta tarefa?')) return
    await fetch('/api/tarefas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarTarefas(projetoAtivo.id)
  }
  async function abrirProjeto(projeto) {
    setProjetoAtivo(projeto)
    await buscarTarefas(projeto.id)
    await buscarRiscos(projeto.id)
    await buscarRoadmapVinculado(projeto.id)
    await buscarDependencias(projeto.id)
    setSugestoesRiscoIA(null)
    setTela('projeto')
  }
  async function criarTarefa() {
    if (!novaTarefa.titulo) return alert('Digite o titulo da tarefa')
    await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...novaTarefa, projeto_id: projetoAtivo.id }) })
    setNovaTarefa({ titulo: '', responsavel: '', data_inicio: '', data_entrega: '', status: 'pendente', tarefa_pai_id: '' })
    setMostrarFormTarefa(false)
    buscarTarefas(projetoAtivo.id)
  }
  async function mudarStatusTarefa(id, status) {
    await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    buscarTarefas(projetoAtivo.id)
  }
  async function atualizarTarefa(id, campos) {
    await fetch('/api/tarefas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...campos }) })
    buscarTarefas(projetoAtivo.id)
  }
  function toggleColapso(id) {
    setColapsados(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id); else novo.add(id)
      return novo
    })
  }
  function statusEDT(t) {
    const hoje = new Date()
    const atrasada = !!t.data_entrega && t.status !== 'concluido' && new Date(t.data_entrega + 'T23:59:59') < hoje
    if (t.status === 'concluido') return { cor: C.verde, atrasada: false, label: 'Concluido' }
    if (atrasada) return { cor: C.vermelho, atrasada: true, label: 'Atrasado' }
    if (t.status === 'em_andamento') return { cor: C.statusInfo, atrasada: false, label: 'Em andamento' }
    return { cor: C.ambar, atrasada: false, label: 'Pendente' }
  }
  function valorEdicao(tarefa, campo) {
    const e = edicoesTarefas[tarefa.id]
    if (e && e[campo] !== undefined) return e[campo]
    if (campo === 'progresso') return tarefa.progresso || 0
    return tarefa[campo] || ''
  }
  function alterarEdicao(id, campo, valor) {
    setEdicoesTarefas(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }))
  }
  function predecessoresDe(tarefaId) {
    const e = edicoesTarefas[tarefaId]
    if (e && e.predecessores !== undefined) return e.predecessores
    return dependencias.filter(d => d.tarefa_id === tarefaId).map(d => d.predecessor_id)
  }
  function alterarPredecessores(id, selectEl) {
    const ids = Array.from(selectEl.selectedOptions).map(o => o.value)
    alterarEdicao(id, 'predecessores', ids)
  }
  async function salvarEdicoesTarefas() {
    const ids = Object.keys(edicoesTarefas)
    if (ids.length === 0) { setMostrarEditarTarefas(false); return }
    setSalvandoEdicoes(true)
    await Promise.all(ids.map(id => {
      const campos = edicoesTarefas[id]
      const corpo = { id }
      if (campos.progresso !== undefined) corpo.progresso = Math.max(0, Math.min(100, Number(campos.progresso) || 0))
      if (campos.data_inicio !== undefined) corpo.data_inicio = campos.data_inicio || null
      if (campos.data_entrega !== undefined) corpo.data_entrega = campos.data_entrega || null
      const chamadas = [fetch('/api/tarefas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })]
      if (campos.predecessores !== undefined) {
        const atuais = dependencias.filter(d => d.tarefa_id === id).map(d => d.predecessor_id)
        const novos = campos.predecessores
        const adicionar = novos.filter(pid => !atuais.includes(pid))
        const remover = atuais.filter(pid => !novos.includes(pid))
        for (const predecessor_id of adicionar) chamadas.push(fetch('/api/tarefas/dependencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarefa_id: id, predecessor_id }) }))
        for (const predecessor_id of remover) chamadas.push(fetch('/api/tarefas/dependencias', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarefa_id: id, predecessor_id }) }))
      }
      return Promise.all(chamadas)
    }))
    setSalvandoEdicoes(false)
    setEdicoesTarefas({})
    buscarTarefas(projetoAtivo.id)
    buscarDependencias(projetoAtivo.id)
  }
  async function detectarRiscosIA() {
    setDetectandoRiscoIA(true)
    setSugestoesRiscoIA(null)
    const res = await fetch('/api/riscos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ detectar_ia: true, projeto_id: projetoAtivo.id }) })
    const data = await res.json()
    setDetectandoRiscoIA(false)
    if (data.erro) return alert('Erro ao detectar riscos: ' + data.erro)
    setSugestoesRiscoIA(data.sugestoes || [])
  }
  async function aceitarSugestaoRisco(sugestao, idx) {
    await fetch('/api/riscos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sugestao, projeto_id: projetoAtivo.id }) })
    setSugestoesRiscoIA(prev => prev.filter((_, i) => i !== idx))
    buscarRiscos(projetoAtivo.id)
  }
  async function gerarTarefasIA() {
    if (!objetivoIA.trim()) return alert('Descreva o objetivo')
    setGerandoIA(true)
    setTarefasIA([])
    const res = await fetch('/api/gerar-tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objetivo: objetivoIA, projeto: projetoAtivo.titulo }) })
    const data = await res.json()
    if (data.erro) { alert('Erro: ' + data.erro) } else {
      setTarefasIA(data.tarefas || [])
      setSelecionadas((data.tarefas || []).map((_, i) => i))
    }
    setGerandoIA(false)
  }
  async function adicionarTarefasSelecionadas() {
    setAdicionando(true)
    const hoje = new Date()
    for (const idx of selecionadas) {
      const t = tarefasIA[idx]
      const dataEntrega = new Date(hoje)
      dataEntrega.setDate(hoje.getDate() + (t.prazo_dias || 7))
      await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: t.titulo, responsavel: t.responsavel || '', data_entrega: dataEntrega.toISOString().split('T')[0], status: 'pendente', projeto_id: projetoAtivo.id }) })
    }
    setAdicionando(false)
    setMostrarGerador(false)
    setObjetivoIA('')
    setTarefasIA([])
    setSelecionadas([])
    buscarTarefas(projetoAtivo.id)
  }
  function toggleSelecionada(idx) {
    if (selecionadas.includes(idx)) setSelecionadas(selecionadas.filter(i => i !== idx))
    else setSelecionadas([...selecionadas, idx])
  }
  function corPrioridade(p) {
    if (p === 'alta') return { bg: '#FEF2F2', color: C.vermelho }
    if (p === 'baixa') return { bg: '#F0FDF4', color: C.verde }
    return { bg: '#EEF2FF', color: C.royal }
  }

  const tarefasPai = tarefas.filter(t => !t.tarefa_pai_id)
  const tarefasFilho = (paiId) => tarefas.filter(t => t.tarefa_pai_id === paiId)
  const pctProjeto = tarefas.length > 0 ? Math.round(tarefas.reduce((s, t) => s + (t.progresso || 0), 0) / tarefas.length) : 0

  const listaEDT = []
  tarefasPai.forEach((pai, idxPai) => {
    const filhos = tarefasFilho(pai.id)
    const numero = String(idxPai + 1)
    listaEDT.push({ tarefa: pai, numero, nivel: 0, contagem: filhos.length })
    filhos.forEach((filho, idxFilho) => {
      listaEDT.push({ tarefa: filho, numero: numero + '.' + (idxFilho + 1), nivel: 1, paiId: pai.id, contagem: 0 })
    })
  })

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '13px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }
  const inputStyle = { width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: C.texto }

  // ── TELA: Lista ─────────────────────────────────────────────────────────────
  if (tela === 'lista') return (
    <AppShell
      title="Projetos"
      subtitle="Sistema de Melhoria"
      actions={
        <>
          <a href="/gantt" className="btn-ghost-hover" style={{ ...btnHeader, background: C.branco }}><GanttChartSquare size={14} /> Gantt</a>
          <button onClick={() => { setMostrarImportar(!mostrarImportar); setResultadoImportacao(null) }} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarImportar ? '#EEF2FF' : 'white' }}><Upload size={14} /> Importar CSV</button>
          <button onClick={() => setTela('novo')} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: C.textoSobreAccent, border: 'none' }}><Plus size={14} /> Novo Projeto</button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {mostrarImportar && (
          <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={16} color={C.royal} /> Importar projetos por CSV</h3>
              <button onClick={baixarModeloCsv} style={{ padding: '7px 14px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={13} /> Baixar modelo CSV
              </button>
            </div>
            <p style={{ color: C.textoSec, fontSize: '13px', margin: '0 0 16px' }}>
              Colunas aceitas: <strong>titulo</strong> (obrigatorio), responsavel, descricao, orcamento, data_prevista_fim (AAAA-MM-DD), prioridade (baixa/media/alta), status (pendente/em_andamento/concluido), area, progresso (0-100), em_risco (true/false).
              Se o titulo ja existir em um projeto cadastrado, os dados dele sao atualizados; senao, um projeto novo e criado.
            </p>
            <input type="file" accept=".csv,text/csv" onChange={lidarComArquivoCsv}
              style={{ display: 'block', marginBottom: '14px', fontSize: '13px', color: C.textoSec }} />

            {csvErro && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px' }}>
                <p style={{ color: C.vermelho, fontSize: '13px', margin: 0 }}>{csvErro}</p>
              </div>
            )}

            {csvPreview.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: C.texto, fontWeight: 700, margin: '0 0 8px' }}>{nomeArquivoCsv} — {csvPreview.length} linha(s) encontrada(s)</p>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: `1px solid ${C.borda}`, borderRadius: '6px' }}>
                  {csvPreview.slice(0, 20).map((linha, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderBottom: i < Math.min(csvPreview.length, 20) - 1 ? `1px solid ${C.fundo}` : 'none', fontSize: '12px', color: C.textoSec }}>
                      <strong style={{ color: C.texto }}>{linha.titulo || '(sem titulo)'}</strong>
                      {linha.responsavel ? ' • ' + linha.responsavel : ''}
                      {linha.orcamento ? ' • ' + formatarMoeda(Number(linha.orcamento)) : ''}
                    </div>
                  ))}
                  {csvPreview.length > 20 && (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: C.textoMudo }}>+ {csvPreview.length - 20} linha(s) a mais</div>
                  )}
                </div>
              </div>
            )}

            {resultadoImportacao && (
              <div style={{ background: '#F0FDF4', border: `1px solid ${C.verde}`, borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ color: '#14532d', fontSize: '13px', margin: 0, fontWeight: 700 }}>
                  {resultadoImportacao.criados || 0} projeto(s) criado(s), {resultadoImportacao.atualizados || 0} atualizado(s)
                  {resultadoImportacao.erros && resultadoImportacao.erros.length > 0 ? ', ' + resultadoImportacao.erros.length + ' erro(s)' : ''}
                </p>
                {resultadoImportacao.erros && resultadoImportacao.erros.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: C.vermelho }}>
                    {resultadoImportacao.erros.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setMostrarImportar(false); setCsvPreview([]); setCsvErro(''); setResultadoImportacao(null) }} style={{ flex: 1, padding: '10px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Fechar</button>
              <button onClick={confirmarImportacaoCsv} disabled={csvPreview.length === 0 || importando}
                style={{ flex: 2, padding: '10px', background: (csvPreview.length === 0 || importando) ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: (csvPreview.length === 0 || importando) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700 }}>
                {importando ? 'Importando...' : 'Importar ' + csvPreview.length + ' projeto(s)'}
              </button>
            </div>
          </div>
        )}

        {projetos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: C.branco, borderRadius: '10px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '17px' }}>Nenhum projeto ainda</p>
            <p style={{ fontSize: '14px' }}>Crie um projeto ou faca uma entrevista de processo</p>
          </div>
        )}

        {projetos.length > 0 && (() => {
          const comStatus = projetos.map(p => ({ p, st: statusPortfolio(p) }))
          const contagem = { concluido: 0, atrasado: 0, em_risco: 0, no_prazo: 0, planejado: 0 }
          comStatus.forEach(x => { contagem[x.st.chave]++ })
          const total = projetos.length
          const emAndamento = projetos.filter(p => p.status === 'em_andamento').length
          const planejadas = projetos.filter(p => p.status === 'pendente').length
          const concluidas = projetos.filter(p => p.status === 'concluido').length

          const statCards = [
            { label: 'Iniciativas', valor: total, cor: C.texto },
            { label: 'Em andamento', valor: emAndamento, cor: C.statusInfo },
            { label: 'Planejadas', valor: planejadas, cor: C.textoMudo },
            { label: 'Concluidas', valor: concluidas, cor: C.verde },
            { label: 'Atrasadas', valor: contagem.atrasado, cor: C.vermelho },
            { label: 'Em risco', valor: contagem.em_risco, cor: C.ambar },
          ]

          const barSegmentos = [
            { chave: 'atrasado', label: 'Atrasado', cor: C.vermelho },
            { chave: 'em_risco', label: 'Em risco', cor: C.ambar },
            { chave: 'no_prazo', label: 'No prazo', cor: C.statusInfo },
            { chave: 'planejado', label: 'Planejado', cor: C.textoMudo },
            { chave: 'concluido', label: 'Concluido', cor: C.verde },
          ]

          const grupos = {}
          projetos.forEach(p => {
            const chave = p.area || 'Sem area'
            if (!grupos[chave]) grupos[chave] = []
            grupos[chave].push(p)
          })
          const gruposOrdenados = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length)

          return (
            <>
              <div className="grid-6" style={{ marginBottom: '18px' }}>
                {statCards.map(c => (
                  <div key={c.label} style={{ background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', color: C.textoMudo, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{c.label}</p>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: c.cor }}>{c.valor}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: C.textoMudo, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Avanco medio do portfolio</p>
                <div style={{ display: 'flex', width: '100%', height: '10px', borderRadius: '6px', overflow: 'hidden', background: C.fundo, marginBottom: '12px' }}>
                  {barSegmentos.map(seg => contagem[seg.chave] > 0 && (
                    <div key={seg.chave} style={{ width: (contagem[seg.chave] / total * 100) + '%', background: seg.cor }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                  {barSegmentos.map(seg => (
                    <span key={seg.chave} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.textoSec }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: seg.cor, display: 'inline-block' }} />
                      {seg.label} · {contagem[seg.chave]}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {gruposOrdenados.map(([area, itens]) => {
                  const emAndamentoArea = itens.filter(p => p.status === 'em_andamento').length
                  const emRiscoArea = itens.filter(p => statusPortfolio(p).chave === 'em_risco').length
                  const avancoArea = itens.length > 0 ? Math.round(itens.reduce((s, p) => s + (p.progresso || 0), 0) / itens.length) : 0
                  return (
                    <div key={area} style={{ background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)', overflow: 'hidden' }}>
                      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.borda}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 3px', color: C.texto, fontSize: '15px', fontWeight: 800 }}>{area}</h3>
                          <p style={{ margin: 0, color: C.textoMudo, fontSize: '12px' }}>{itens.length} iniciativa(s) · {emAndamentoArea} em andamento</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 220px', maxWidth: '320px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', color: C.textoMudo, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Avanco medio</p>
                            <div style={{ width: '100%', height: '7px', borderRadius: '4px', background: C.fundo, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: avancoArea + '%', background: C.statusInfo }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: C.texto }}>{avancoArea}%</span>
                          {emRiscoArea > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: C.ambar, background: '#FFFBEB', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{emRiscoArea} em risco</span>
                          )}
                        </div>
                      </div>
                      <div>
                        {itens.map(p => {
                          const st = statusPortfolio(p)
                          const hoje = new Date()
                          const prazoProximo = !!p.data_prevista_fim && st.chave !== 'concluido' && st.chave !== 'atrasado' && (new Date(p.data_prevista_fim + 'T23:59:59') - hoje) < 1000 * 60 * 60 * 24 * 60
                          return (
                            <div key={p.id} onClick={() => abrirProjeto(p)} className="card-elevate" style={{ padding: '14px 20px', borderBottom: `1px solid ${C.fundo}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                              <div style={{ flex: '2 1 260px', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <p style={{ margin: 0, color: C.texto, fontSize: '13.5px', fontWeight: 600 }}>{p.titulo}</p>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: st.cor, background: st.bg, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.cor, display: 'inline-block' }} />
                                    {st.label}
                                  </span>
                                </div>
                                {p.responsavel && <p style={{ margin: '3px 0 0', color: C.textoMudo, fontSize: '11.5px' }}>{p.responsavel}</p>}
                              </div>
                              <div style={{ flex: '1 1 140px', maxWidth: '180px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', borderRadius: '4px', background: C.fundo, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: (p.progresso || 0) + '%', background: st.cor }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: C.textoSec, minWidth: '30px', textAlign: 'right' }}>{p.progresso || 0}%</span>
                              </div>
                              <div style={{ minWidth: '110px', textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: C.textoSec }}>{p.data_prevista_fim ? new Date(p.data_prevista_fim + 'T12:00:00').toLocaleDateString('pt-BR') : 'sem prazo'}</p>
                                {st.chave === 'atrasado' && <p style={{ margin: 0, fontSize: '10.5px', color: C.vermelho, fontStyle: 'italic' }}>atrasada</p>}
                                {prazoProximo && <p style={{ margin: 0, fontSize: '10.5px', color: C.textoMudo, fontStyle: 'italic' }}>prazo proximo</p>}
                              </div>
                              <button onClick={e => deletarProjeto(e, p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '4px' }} title="Deletar projeto"><Trash2 size={15} /></button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        })()}
      </div>
    </AppShell>
  )

  // ── TELA: Novo Projeto ───────────────────────────────────────────────────────
  if (tela === 'novo') return (
    <AppShell title="Novo Projeto" subtitle="Projetos" actions={<button onClick={() => setTela('lista')} style={btnHeader}>← Voltar</button>}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
        <div style={{ background: C.branco, borderRadius: '8px', padding: '36px', width: '100%', maxWidth: '600px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <input placeholder="Titulo do projeto" value={novoProj.titulo} onChange={e => setNovoProj({ ...novoProj, titulo: e.target.value })}
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <input placeholder="Responsavel" value={novoProj.responsavel} onChange={e => setNovoProj({ ...novoProj, responsavel: e.target.value })}
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <input placeholder="Area (ex: Data Science, Infraestrutura)" value={novoProj.area} onChange={e => setNovoProj({ ...novoProj, area: e.target.value })}
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <textarea placeholder="Descricao (opcional)" value={novoProj.descricao} onChange={e => setNovoProj({ ...novoProj, descricao: e.target.value })} rows={3}
            style={{ ...inputStyle, marginBottom: '12px', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ fontSize: '12px', color: C.textoSec }}>Orcamento (R$, opcional)</label>
              <input type="number" value={novoProj.orcamento} onChange={e => setNovoProj({ ...novoProj, orcamento: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ fontSize: '12px', color: C.textoSec }}>Prazo previsto (opcional)</label>
              <input type="date" value={novoProj.data_prevista_fim} onChange={e => setNovoProj({ ...novoProj, data_prevista_fim: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ fontSize: '12px', color: C.textoSec }}>Prioridade</label>
              <select value={novoProj.prioridade} onChange={e => setNovoProj({ ...novoProj, prioridade: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="baixa">Baixa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <button onClick={criarProjeto} className="btn-hover" style={{ width: '100%', padding: '13px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 700 }}>
            Criar Projeto
          </button>
        </div>
      </div>
    </AppShell>
  )

  // ── TELA: Projeto (tarefas) ──────────────────────────────────────────────────
  if (tela === 'projeto') return (
    <AppShell
      title={projetoAtivo.titulo}
      subtitle={projetoAtivo.responsavel || 'Projetos'}
      actions={
        <>
          <button onClick={() => setTela('lista')} style={btnHeader}>← Projetos</button>
          <a href="/gantt" className="btn-ghost-hover" style={{ ...btnHeader, background: C.branco }}><GanttChartSquare size={14} /> Gantt</a>
          <button onClick={() => { setMostrarRiscos(!mostrarRiscos); setMostrarGerador(false); setMostrarFormTarefa(false); setMostrarEditar(false) }} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarRiscos ? '#FEF2F2' : 'white', color: mostrarRiscos ? C.vermelho : C.texto }}>
            <AlertTriangle size={14} /> Riscos{riscos.filter(r => r.status === 'aberto').length > 0 ? ' (' + riscos.filter(r => r.status === 'aberto').length + ')' : ''}
          </button>
          <button onClick={abrirEditar} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarEditar ? '#EEF2FF' : 'white' }}><Pencil size={14} /> Editar</button>
          <button onClick={() => { setMostrarGerador(!mostrarGerador); setMostrarFormTarefa(false); setMostrarRiscos(false); setMostrarEditar(false) }} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarGerador ? '#EEF2FF' : 'white' }}><Sparkles size={14} /> Gerar com IA</button>
          <button onClick={() => { setMostrarFormTarefa(!mostrarFormTarefa); setMostrarGerador(false); setMostrarRiscos(false); setMostrarEditar(false) }} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: C.textoSobreAccent, border: 'none' }}><Plus size={14} /> Nova Tarefa</button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {(projetoAtivo.orcamento || projetoAtivo.data_prevista_fim || projetoAtivo.prioridade || tarefas.length > 0) && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {projetoAtivo.prioridade && (
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: corPrioridade(projetoAtivo.prioridade).bg, color: corPrioridade(projetoAtivo.prioridade).color, fontWeight: 'bold' }}>
                Prioridade: {projetoAtivo.prioridade}
              </span>
            )}
            {projetoAtivo.data_prevista_fim && (
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: C.fundo, color: C.textoSec, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Prazo: {new Date(projetoAtivo.data_prevista_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
            )}
            {projetoAtivo.orcamento && (
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: C.fundo, color: C.textoSec, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={12} /> Orcamento: {formatarMoeda(projetoAtivo.orcamento)}
              </span>
            )}
            {tarefas.length > 0 && (
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: '#EEF2FF', color: C.royal, fontWeight: 'bold' }}>
                Progresso geral: {pctProjeto}%
              </span>
            )}
          </div>
        )}

        {/* Cronograma — EDT */}
        {tarefas.length > 0 && (
          <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><GanttChartSquare size={16} color={C.royal} /> Visao de projeto (EDT)</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button onClick={() => setMostrarEditarTarefas(!mostrarEditarTarefas)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: mostrarEditarTarefas ? '#EEF2FF' : C.fundo, border: `1px solid ${C.borda}`, borderRadius: '6px', padding: '6px 12px', color: C.royal, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  <ListChecks size={13} /> Editar tarefas (% e datas)
                </button>
                <span style={{ fontSize: '12px', color: C.textoSec }}>{tarefas.length} tarefa(s)</span>
              </div>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '11px', color: C.textoMudo }}>Clique nos itens com seta para expandir/recolher</p>

            {mostrarEditarTarefas && (
              <div style={{ background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', padding: '18px', marginBottom: '18px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: C.texto }}>Editar tarefas (% e datas)</h4>
                <p style={{ margin: '0 0 14px', fontSize: '11px', color: C.textoMudo }}>Altere conclusao e datas; os indicadores recalculam ao salvar.</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                    <thead>
                      <tr>
                        {['EDT', 'Descricao', 'Status', '% Conclusao', 'Inicio', 'Termino', 'Predecessoras'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '11px', color: C.textoSec, fontWeight: 700, borderBottom: `1px solid ${C.borda}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {listaEDT.map(item => {
                        const st = statusEDT(item.tarefa)
                        return (
                          <tr key={item.tarefa.id}>
                            <td style={{ padding: '7px 10px', fontSize: '11px', color: C.textoMudo, borderBottom: `1px solid ${C.borda}` }}>{item.numero}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: C.texto, borderBottom: `1px solid ${C.borda}`, paddingLeft: (item.nivel * 16 + 10) + 'px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tarefa.titulo}</td>
                            <td style={{ padding: '7px 10px', fontSize: '11px', color: st.cor, fontWeight: 700, borderBottom: `1px solid ${C.borda}` }}>{st.label}</td>
                            <td style={{ padding: '5px 10px', borderBottom: `1px solid ${C.borda}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="number" min="0" max="100" value={valorEdicao(item.tarefa, 'progresso')}
                                  onChange={e => alterarEdicao(item.tarefa.id, 'progresso', e.target.value)}
                                  style={{ width: '54px', padding: '5px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '12px', textAlign: 'center' }} />
                                <span style={{ fontSize: '11px', color: C.textoMudo }}>%</span>
                              </div>
                            </td>
                            <td style={{ padding: '5px 10px', borderBottom: `1px solid ${C.borda}` }}>
                              <input type="date" value={valorEdicao(item.tarefa, 'data_inicio')}
                                onChange={e => alterarEdicao(item.tarefa.id, 'data_inicio', e.target.value)}
                                style={{ padding: '5px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '12px' }} />
                            </td>
                            <td style={{ padding: '5px 10px', borderBottom: `1px solid ${C.borda}` }}>
                              <input type="date" value={valorEdicao(item.tarefa, 'data_entrega')}
                                onChange={e => alterarEdicao(item.tarefa.id, 'data_entrega', e.target.value)}
                                style={{ padding: '5px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '12px' }} />
                            </td>
                            <td style={{ padding: '5px 10px', borderBottom: `1px solid ${C.borda}` }}>
                              <select multiple value={predecessoresDe(item.tarefa.id)} onChange={e => alterarPredecessores(item.tarefa.id, e.target)}
                                style={{ padding: '4px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '11px', minWidth: '140px', height: '56px' }}>
                                {tarefas.filter(t => t.id !== item.tarefa.id).map(t => (
                                  <option key={t.id} value={t.id}>{t.titulo}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => { setMostrarEditarTarefas(false); setEdicoesTarefas({}) }} style={{ padding: '9px 16px', background: C.branco, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                  <button onClick={salvarEdicoesTarefas} disabled={salvandoEdicoes} style={{ padding: '9px 20px', background: salvandoEdicoes ? C.textoMudo : C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '6px', cursor: salvandoEdicoes ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
                    {salvandoEdicoes ? 'Salvando...' : 'Salvar alteracoes'}
                  </button>
                </div>
              </div>
            )}

            <div>
              {listaEDT.filter(item => item.nivel === 0 || !colapsados.has(item.paiId)).map(item => {
                const st = statusEDT(item.tarefa)
                const t = item.tarefa
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 6px', paddingLeft: (item.nivel * 22 + 6) + 'px', borderBottom: `1px solid ${C.fundo}`, flexWrap: 'wrap' }}>
                    <div style={{ width: '16px', display: 'flex', justifyContent: 'center', cursor: item.nivel === 0 && item.contagem > 0 ? 'pointer' : 'default', flexShrink: 0 }}
                      onClick={() => item.nivel === 0 && item.contagem > 0 && toggleColapso(t.id)}>
                      {item.nivel === 0 && item.contagem > 0 ? (colapsados.has(t.id) ? <ChevronRight size={14} color={C.textoMudo} /> : <ChevronDown size={14} color={C.textoMudo} />) : null}
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.cor, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: C.textoMudo, minWidth: '32px' }}>{item.numero}</span>
                    <span style={{ fontSize: item.nivel === 0 ? '13px' : '12.5px', fontWeight: item.nivel === 0 ? 700 : 500, color: item.nivel === 0 ? C.texto : C.royal, flex: '1 1 200px', minWidth: 0 }}>{t.titulo}</span>
                    {st.atrasada && <span style={{ fontSize: '10px', fontWeight: 700, color: C.vermelho, background: '#FEF2F2', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>Atrasada</span>}
                    {t.responsavel && <span style={{ fontSize: '11px', color: C.textoMudo, minWidth: '90px', flexShrink: 0 }}>{t.responsavel}</span>}
                    <span style={{ fontSize: '11px', color: C.textoMudo, minWidth: '150px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} />
                      {t.data_inicio ? new Date(t.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} &rarr; {t.data_entrega ? new Date(t.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px', flexShrink: 0 }}>
                      <div style={{ width: '50px', height: '6px', background: C.fundo, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (t.progresso || 0) + '%', background: st.cor }} />
                      </div>
                      <span style={{ fontSize: '11px', color: C.textoSec, fontWeight: 700 }}>{t.progresso || 0}%</span>
                    </div>
                    {item.contagem > 0 && <span style={{ fontSize: '10px', color: C.textoMudo, background: C.fundo, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>{item.contagem} tarefa(s)</span>}
                    <select value={t.status} onChange={e => mudarStatusTarefa(t.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${C.borda}`, background: C.branco, color: C.textoSec, cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluido</option>
                    </select>
                    <button onClick={() => deletarTarefa(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '2px', flexShrink: 0 }}><Trash2 size={14} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Editar projeto */}
        {mostrarEditar && (
          <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Pencil size={16} color={C.royal} /> Editar projeto</h3>
            <input placeholder="Titulo do projeto" value={editProj.titulo} onChange={e => setEditProj({ ...editProj, titulo: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="Responsavel" value={editProj.responsavel} onChange={e => setEditProj({ ...editProj, responsavel: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="Area (ex: Data Science, Infraestrutura)" value={editProj.area} onChange={e => setEditProj({ ...editProj, area: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
            <textarea placeholder="Descricao" value={editProj.descricao} onChange={e => setEditProj({ ...editProj, descricao: e.target.value })} rows={2} style={{ ...inputStyle, marginBottom: '10px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Orcamento (R$)</label>
                <input type="number" value={editProj.orcamento} onChange={e => setEditProj({ ...editProj, orcamento: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Prazo previsto</label>
                <input type="date" value={editProj.data_prevista_fim} onChange={e => setEditProj({ ...editProj, data_prevista_fim: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Prioridade</label>
                <select value={editProj.prioridade} onChange={e => setEditProj({ ...editProj, prioridade: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Progresso geral (%)</label>
                <input type="number" min="0" max="100" value={editProj.progresso} onChange={e => setEditProj({ ...editProj, progresso: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <label style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.texto, padding: '10px 0' }}>
                <input type="checkbox" checked={editProj.em_risco} onChange={e => setEditProj({ ...editProj, em_risco: e.target.checked })} />
                Marcar como em risco
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarEditar(false)} style={{ flex: 1, padding: '10px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={salvarEdicaoProjeto} style={{ flex: 2, padding: '10px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Salvar alteracoes</button>
            </div>
          </div>
        )}

        {/* Riscos */}
        {mostrarRiscos && (
          <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.ambar}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} color={C.ambar} /> Riscos do projeto</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={detectarRiscosIA} disabled={detectandoRiscoIA} style={{ padding: '7px 14px', background: '#EEF2FF', color: C.royal, border: `1px solid ${C.royal}`, borderRadius: '6px', cursor: detectandoRiscoIA ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Wand2 size={13} /> {detectandoRiscoIA ? 'Analisando...' : 'Detectar riscos com IA'}
                </button>
                {roadmapVinculado && roadmapVinculado.riscos && roadmapVinculado.riscos.length > 0 && (
                  <button onClick={importarRiscosRoadmap} style={{ padding: '7px 14px', background: '#EEF2FF', color: C.royal, border: `1px solid ${C.royal}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    Importar sugestoes do roadmap ({roadmapVinculado.riscos.length})
                  </button>
                )}
              </div>
            </div>

            {sugestoesRiscoIA && (
              <div style={{ marginBottom: '18px' }}>
                {sugestoesRiscoIA.length === 0 ? (
                  <p style={{ color: C.textoMudo, fontSize: '12.5px', background: C.fundo, padding: '10px 14px', borderRadius: '8px' }}>A IA nao encontrou sinais suficientes para sugerir novos riscos agora.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sugestoesRiscoIA.map((s, i) => (
                      <div key={i} style={{ border: `1px dashed ${C.royal}`, borderRadius: '8px', padding: '12px 14px', background: '#EEF2FF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 'bold', color: C.texto }}>{s.descricao}</p>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: C.textoMudo, flexWrap: 'wrap' }}>
                              {s.categoria && <span>{s.categoria}</span>}
                              <span>Probabilidade: {s.probabilidade}</span>
                              <span>Impacto: {s.impacto}</span>
                            </div>
                            {s.mitigacao && <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textoSec }}>Mitigacao: {s.mitigacao}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => aceitarSugestaoRisco(s, i)} style={{ padding: '6px 12px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Adicionar</button>
                            <button onClick={() => setSugestoesRiscoIA(prev => prev.filter((_, idx) => idx !== i))} style={{ padding: '6px 12px', background: C.branco, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Ignorar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {riscos.filter(r => r.status === 'aberto').length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: C.textoSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Matriz de probabilidade x impacto</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: '3px', maxWidth: '440px' }}>
                  <div />
                  {['Baixo', 'Medio', 'Alto'].map(l => <div key={l} style={{ textAlign: 'center', fontSize: '10px', color: C.textoMudo, fontWeight: 700 }}>{l}</div>)}
                  {['alta', 'media', 'baixa'].map(prob => (
                    <Fragment key={prob}>
                      <div style={{ fontSize: '10px', color: C.textoMudo, fontWeight: 700, display: 'flex', alignItems: 'center', paddingRight: '6px', textTransform: 'capitalize' }}>{prob}</div>
                      {['baixo', 'medio', 'alto'].map(imp => {
                        const celulaRiscos = riscos.filter(r => r.status === 'aberto' && r.probabilidade === prob && r.impacto === imp)
                        const score = PESO_PROBABILIDADE[prob] * PESO_IMPACTO[imp]
                        return (
                          <div key={prob + imp} title={celulaRiscos.map(r => r.descricao).join(', ')}
                            style={{ minHeight: '40px', borderRadius: '6px', background: corScore(score), opacity: celulaRiscos.length > 0 ? 1 : 0.18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 800 }}>
                            {celulaRiscos.length > 0 ? celulaRiscos.length : ''}
                          </div>
                        )
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}

            {riscos.length === 0 && <p style={{ color: C.textoMudo, fontSize: '13px', margin: '0 0 16px' }}>Nenhum risco registrado ainda</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {riscos.map(r => (
                <div key={r.id} style={{ border: `1px solid ${C.borda}`, borderLeft: `4px solid ${coresImpacto[r.impacto] || C.textoMudo}`, borderRadius: '8px', padding: '14px', opacity: r.status === 'fechado' ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 'bold', color: C.texto }}>{r.descricao}</p>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: C.textoMudo, flexWrap: 'wrap' }}>
                        {r.categoria && <span>{r.categoria}</span>}
                        <span>Probabilidade: {r.probabilidade}</span>
                        <span>Impacto: {r.impacto}</span>
                        {r.responsavel && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><User size={11} /> {r.responsavel}</span>}
                      </div>
                      {r.mitigacao && <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textoSec }}>Mitigacao: {r.mitigacao}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <select value={r.status} onChange={e => atualizarRisco(r.id, { status: e.target.value })}
                        style={{ fontSize: '11px', padding: '5px 8px', borderRadius: '6px', border: `1px solid ${C.borda}`, cursor: 'pointer' }}>
                        <option value="aberto">Aberto</option>
                        <option value="mitigado">Mitigado</option>
                        <option value="fechado">Fechado</option>
                      </select>
                      <button onClick={() => deletarRisco(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '2px' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <textarea placeholder="Descreva o risco" value={novoRisco.descricao} onChange={e => setNovoRisco({ ...novoRisco, descricao: e.target.value })} rows={2}
              style={{ ...inputStyle, marginBottom: '8px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <input placeholder="Categoria (opcional)" value={novoRisco.categoria} onChange={e => setNovoRisco({ ...novoRisco, categoria: e.target.value })}
                style={{ ...inputStyle, flex: 1, minWidth: '140px' }} />
              <select value={novoRisco.probabilidade} onChange={e => setNovoRisco({ ...novoRisco, probabilidade: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: '130px' }}>
                <option value="baixa">Probabilidade: baixa</option>
                <option value="media">Probabilidade: media</option>
                <option value="alta">Probabilidade: alta</option>
              </select>
              <select value={novoRisco.impacto} onChange={e => setNovoRisco({ ...novoRisco, impacto: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: '130px' }}>
                <option value="baixo">Impacto: baixo</option>
                <option value="medio">Impacto: medio</option>
                <option value="alto">Impacto: alto</option>
              </select>
            </div>
            <input placeholder="Responsavel (opcional)" value={novoRisco.responsavel} onChange={e => setNovoRisco({ ...novoRisco, responsavel: e.target.value })}
              style={{ ...inputStyle, marginBottom: '8px' }} />
            <textarea placeholder="Mitigacao (opcional)" value={novoRisco.mitigacao} onChange={e => setNovoRisco({ ...novoRisco, mitigacao: e.target.value })} rows={2}
              style={{ ...inputStyle, marginBottom: '12px', resize: 'vertical' }} />
            <button onClick={criarRisco} style={{ padding: '9px 20px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Adicionar risco
            </button>
          </div>
        )}

        {/* Gerador IA */}
        {mostrarGerador && (
          <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={16} color={C.royal} /> Gerar tarefas com IA</h3>
            <p style={{ color: C.textoSec, fontSize: '13px', margin: '0 0 14px' }}>Descreva o objetivo e a IA cria as tarefas automaticamente</p>
            <textarea
              placeholder="Ex: Precisamos migrar 3 servidores para AWS, incluindo testes de carga e treinamento da equipe..."
              value={objetivoIA}
              onChange={e => setObjetivoIA(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', color: C.texto }}
            />
            <button onClick={gerarTarefasIA} disabled={gerandoIA} style={{ padding: '9px 20px', background: gerandoIA ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: gerandoIA ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {gerandoIA ? 'Gerando...' : 'Gerar tarefas'}
            </button>
            {tarefasIA.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 'bold', color: C.texto, margin: 0, fontSize: '14px' }}>Tarefas sugeridas</p>
                  <span style={{ fontSize: '12px', background: '#F0FDF4', color: C.verde, padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{tarefasIA.length} tarefas geradas</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {tarefasIA.map((t, idx) => {
                    const cp = corPrioridade(t.prioridade)
                    return (
                      <div key={idx} onClick={() => toggleSelecionada(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: selecionadas.includes(idx) ? '#EEF2FF' : C.fundo, border: `1px solid ${selecionadas.includes(idx) ? C.royal : C.borda}`, borderRadius: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selecionadas.includes(idx)} onChange={() => toggleSelecionada(idx)} style={{ width: '16px', height: '16px', accentColor: C.royal, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px', color: C.texto }}>{t.titulo}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: C.textoMudo }}>
                            {t.responsavel && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><User size={11} /> {t.responsavel}</span>}
                            {t.prazo_dias && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Calendar size={11} /> {t.prazo_dias} dias</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', background: cp.bg, color: cp.color, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{t.prioridade}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => { setTarefasIA([]); setObjetivoIA('') }} style={{ padding: '9px 16px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                  <button onClick={adicionarTarefasSelecionadas} disabled={adicionando || selecionadas.length === 0} style={{ padding: '9px 20px', background: adicionando ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: adicionando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    {adicionando ? 'Adicionando...' : 'Adicionar ' + selecionadas.length + ' tarefa(s) ao projeto'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form nova tarefa */}
        {mostrarFormTarefa && (
          <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: C.texto, fontSize: '15px', fontWeight: 'bold' }}>Nova Tarefa</h3>
            <input placeholder="Titulo da tarefa" value={novaTarefa.titulo} onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="Responsavel" value={novaTarefa.responsavel} onChange={e => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Data inicio</label>
                <input type="date" value={novaTarefa.data_inicio} onChange={e => setNovaTarefa({ ...novaTarefa, data_inicio: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: C.textoSec }}>Data entrega</label>
                <input type="date" value={novaTarefa.data_entrega} onChange={e => setNovaTarefa({ ...novaTarefa, data_entrega: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: C.textoSec }}>Tarefa pai (opcional)</label>
              <select value={novaTarefa.tarefa_pai_id} onChange={e => setNovaTarefa({ ...novaTarefa, tarefa_pai_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">Nenhuma (tarefa principal)</option>
                {tarefasPai.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarFormTarefa(false)} style={{ flex: 1, padding: '10px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={criarTarefa} style={{ flex: 2, padding: '10px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Criar Tarefa</button>
            </div>
          </div>
        )}

        {tarefas.length === 0 && !mostrarFormTarefa && !mostrarGerador && (
          <div style={{ textAlign: 'center', padding: '60px', background: C.branco, borderRadius: '8px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '15px' }}>Nenhuma tarefa. Clique em "Nova Tarefa" ou "Gerar com IA" para comecar.</p>
          </div>
        )}

      </div>
    </AppShell>
  )
}
