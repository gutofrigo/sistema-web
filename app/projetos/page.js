'use client'
import { useState, useEffect } from 'react'
import { GanttChartSquare, AlertTriangle, Pencil, Sparkles, Plus, Trash2, User, Calendar, Paperclip, Wallet, Upload, Download } from 'lucide-react'
import AppShell from '../components/AppShell'
import { GanttChart, fmt, parseData } from '../components/GanttChart'
import { theme as C } from '../theme'

const coresStatus = { pendente: C.ambar, em_andamento: C.royal, concluido: C.verde }
const coresImpacto = { baixo: C.verde, medio: C.ambar, alto: C.vermelho }

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
  const [novoProj, setNovoProj] = useState({ titulo: '', responsavel: '', descricao: '', orcamento: '', data_prevista_fim: '', prioridade: 'media' })
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', responsavel: '', data_inicio: '', data_entrega: '', status: 'pendente', tarefa_pai_id: '' })
  const [novoRisco, setNovoRisco] = useState({ descricao: '', categoria: '', probabilidade: 'media', impacto: 'medio', mitigacao: '', responsavel: '' })
  const [editProj, setEditProj] = useState({ titulo: '', descricao: '', responsavel: '', orcamento: '', data_prevista_fim: '', prioridade: 'media' })
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
  async function criarProjeto() {
    if (!novoProj.titulo) return alert('Digite o titulo do projeto')
    await fetch('/api/projetos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoProj) })
    setNovoProj({ titulo: '', responsavel: '', descricao: '', orcamento: '', data_prevista_fim: '', prioridade: 'media' })
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
      prioridade: projetoAtivo.prioridade || 'media'
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
    const modelo = 'titulo,responsavel,descricao,orcamento,data_prevista_fim,prioridade,status\n' +
      'Migracao para nuvem AWS,Carlos Mendes,Migrar infraestrutura para AWS,180000,2026-12-31,alta,em_andamento\n'
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
  const tarefasComDatas = tarefas.filter(t => t.data_entrega).map(t => ({
    ...t,
    inicio: parseData(t.data_inicio) || parseData(t.data_entrega),
    fim: parseData(t.data_entrega)
  }))
  const pctProjeto = tarefas.length > 0 ? Math.round(tarefas.reduce((s, t) => s + (t.progresso || 0), 0) / tarefas.length) : 0

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '13px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }
  const inputStyle = { width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: C.texto }

  // ── TELA: Lista ─────────────────────────────────────────────────────────────
  if (tela === 'lista') return (
    <AppShell
      title="Projetos"
      subtitle="Sistema de Melhoria"
      actions={
        <>
          <a href="/gantt" className="btn-ghost-hover" style={{ ...btnHeader, background: 'white' }}><GanttChartSquare size={14} /> Gantt</a>
          <button onClick={() => { setMostrarImportar(!mostrarImportar); setResultadoImportacao(null) }} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarImportar ? '#EEF2FF' : 'white' }}><Upload size={14} /> Importar CSV</button>
          <button onClick={() => setTela('novo')} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: 'white', border: 'none' }}><Plus size={14} /> Novo Projeto</button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {mostrarImportar && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={16} color={C.royal} /> Importar projetos por CSV</h3>
              <button onClick={baixarModeloCsv} style={{ padding: '7px 14px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={13} /> Baixar modelo CSV
              </button>
            </div>
            <p style={{ color: C.textoSec, fontSize: '13px', margin: '0 0 16px' }}>
              Colunas aceitas: <strong>titulo</strong> (obrigatorio), responsavel, descricao, orcamento, data_prevista_fim (AAAA-MM-DD), prioridade (baixa/media/alta), status (pendente/em_andamento/concluido).
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
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '10px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '17px' }}>Nenhum projeto ainda</p>
            <p style={{ fontSize: '14px' }}>Crie um projeto ou faca uma entrevista de processo</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projetos.map(p => (
            <div key={p.id} onClick={() => abrirProjeto(p)} className="card-elevate" style={{ background: 'white', border: `1px solid #E7ECF3`, borderLeft: `5px solid ${coresStatus[p.status] || C.royal}`, borderRadius: '14px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 2px 6px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: C.texto, fontSize: '15px' }}>{p.titulo}</h3>
                  <p style={{ margin: 0, color: C.textoMudo, fontSize: '13px' }}>{p.responsavel || 'Sem responsavel'} • {new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: coresStatus[p.status] || C.royal, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{p.status}</span>
                  <button onClick={e => deletarProjeto(e, p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '4px' }} title="Deletar projeto"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )

  // ── TELA: Novo Projeto ───────────────────────────────────────────────────────
  if (tela === 'novo') return (
    <AppShell title="Novo Projeto" subtitle="Projetos" actions={<button onClick={() => setTela('lista')} style={btnHeader}>← Voltar</button>}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '36px', width: '100%', maxWidth: '600px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <input placeholder="Titulo do projeto" value={novoProj.titulo} onChange={e => setNovoProj({ ...novoProj, titulo: e.target.value })}
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <input placeholder="Responsavel" value={novoProj.responsavel} onChange={e => setNovoProj({ ...novoProj, responsavel: e.target.value })}
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
          <button onClick={criarProjeto} className="btn-hover" style={{ width: '100%', padding: '13px', background: C.royal, color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 700 }}>
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
          <a href="/gantt" className="btn-ghost-hover" style={{ ...btnHeader, background: 'white' }}><GanttChartSquare size={14} /> Gantt</a>
          <button onClick={() => { setMostrarRiscos(!mostrarRiscos); setMostrarGerador(false); setMostrarFormTarefa(false); setMostrarEditar(false) }} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarRiscos ? '#FEF2F2' : 'white', color: mostrarRiscos ? C.vermelho : C.texto }}>
            <AlertTriangle size={14} /> Riscos{riscos.filter(r => r.status === 'aberto').length > 0 ? ' (' + riscos.filter(r => r.status === 'aberto').length + ')' : ''}
          </button>
          <button onClick={abrirEditar} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarEditar ? '#EEF2FF' : 'white' }}><Pencil size={14} /> Editar</button>
          <button onClick={() => { setMostrarGerador(!mostrarGerador); setMostrarFormTarefa(false); setMostrarRiscos(false); setMostrarEditar(false) }} className="btn-ghost-hover" style={{ ...btnHeader, background: mostrarGerador ? '#EEF2FF' : 'white' }}><Sparkles size={14} /> Gerar com IA</button>
          <button onClick={() => { setMostrarFormTarefa(!mostrarFormTarefa); setMostrarGerador(false); setMostrarRiscos(false); setMostrarEditar(false) }} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: 'white', border: 'none' }}><Plus size={14} /> Nova Tarefa</button>
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

        {/* Cronograma */}
        {tarefas.length > 0 && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><GanttChartSquare size={16} color={C.royal} /> Cronograma</h3>
              <span style={{ fontSize: '12px', color: C.textoSec }}>{tarefasComDatas.length} tarefa(s) com data</span>
            </div>
            {tarefasComDatas.length === 0 ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Defina uma data de entrega nas tarefas para ver o cronograma</p>
            ) : (
              <GanttChart
                itens={tarefasComDatas}
                colunaLabel="Tarefa"
                getCor={(item) => coresStatus[item.status] || C.textoMudo}
                getLabel={(item) => (item.progresso || 0) + '%'}
                getSubLabel={(item) => item.status + ' • ate ' + fmt(item.fim)}
                colNome={160}
              />
            )}
          </div>
        )}

        {/* Editar projeto */}
        {mostrarEditar && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Pencil size={16} color={C.royal} /> Editar projeto</h3>
            <input placeholder="Titulo do projeto" value={editProj.titulo} onChange={e => setEditProj({ ...editProj, titulo: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="Responsavel" value={editProj.responsavel} onChange={e => setEditProj({ ...editProj, responsavel: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarEditar(false)} style={{ flex: 1, padding: '10px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={salvarEdicaoProjeto} style={{ flex: 2, padding: '10px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Salvar alteracoes</button>
            </div>
          </div>
        )}

        {/* Riscos */}
        {mostrarRiscos && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.ambar}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} color={C.ambar} /> Riscos do projeto</h3>
              {roadmapVinculado && roadmapVinculado.riscos && roadmapVinculado.riscos.length > 0 && (
                <button onClick={importarRiscosRoadmap} style={{ padding: '7px 14px', background: '#EEF2FF', color: C.royal, border: `1px solid ${C.royal}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  Importar sugestoes do roadmap ({roadmapVinculado.riscos.length})
                </button>
              )}
            </div>

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
            <button onClick={criarRisco} style={{ padding: '9px 20px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Adicionar risco
            </button>
          </div>
        )}

        {/* Gerador IA */}
        {mostrarGerador && (
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
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
          <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
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
              <button onClick={criarTarefa} style={{ flex: 2, padding: '10px', background: C.royal, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Criar Tarefa</button>
            </div>
          </div>
        )}

        {tarefas.length === 0 && !mostrarFormTarefa && !mostrarGerador && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '15px' }}>Nenhuma tarefa. Clique em "Nova Tarefa" ou "Gerar com IA" para comecar.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tarefasPai.map(tarefa => (
            <div key={tarefa.id}>
              <div style={{ background: 'white', border: `1px solid ${C.borda}`, borderLeft: `4px solid ${coresStatus[tarefa.status] || C.royal}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: C.texto, fontSize: '14px' }}>{tarefa.titulo}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: C.textoMudo, flexWrap: 'wrap', alignItems: 'center' }}>
                      {tarefa.responsavel && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><User size={12} /> {tarefa.responsavel}</span>}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={12} />
                        <input type="date" defaultValue={tarefa.data_entrega || ''} onBlur={e => atualizarTarefa(tarefa.id, { data_entrega: e.target.value || null })}
                          style={{ border: `1px solid ${C.borda}`, borderRadius: '4px', background: 'transparent', fontSize: '12px', color: C.textoSec, padding: '2px 4px' }} />
                      </span>
                      {tarefasFilho(tarefa.id).length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Paperclip size={12} /> {tarefasFilho(tarefa.id).length} subtarefa(s)</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <input type="number" min="0" max="100" defaultValue={tarefa.progresso || 0}
                        onBlur={e => atualizarTarefa(tarefa.id, { progresso: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                        style={{ width: '44px', padding: '5px 4px', borderRadius: '6px', border: `1px solid ${C.borda}`, fontSize: '12px', textAlign: 'center' }} />
                      <span style={{ fontSize: '11px', color: C.textoMudo }}>%</span>
                    </div>
                    <select value={tarefa.status} onChange={e => mudarStatusTarefa(tarefa.id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: coresStatus[tarefa.status] || C.royal, color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluido</option>
                    </select>
                    <button onClick={() => deletarTarefa(tarefa.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '4px' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
              {tarefasFilho(tarefa.id).map(filho => (
                <div key={filho.id} style={{ marginLeft: '28px', marginTop: '4px', background: C.fundo, border: `1px solid ${C.borda}`, borderLeft: `4px solid ${coresStatus[filho.status] || C.textoMudo}`, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: C.texto, fontSize: '13px' }}>{filho.titulo}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: C.textoMudo, alignItems: 'center' }}>
                        {filho.responsavel && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><User size={11} /> {filho.responsavel}</span>}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} />
                          <input type="date" defaultValue={filho.data_entrega || ''} onBlur={e => atualizarTarefa(filho.id, { data_entrega: e.target.value || null })}
                            style={{ border: `1px solid ${C.borda}`, borderRadius: '4px', background: 'transparent', fontSize: '11px', color: C.textoMudo, padding: '2px 4px' }} />
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input type="number" min="0" max="100" defaultValue={filho.progresso || 0}
                          onBlur={e => atualizarTarefa(filho.id, { progresso: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                          style={{ width: '40px', padding: '4px', borderRadius: '6px', border: `1px solid ${C.borda}`, fontSize: '11px', textAlign: 'center' }} />
                        <span style={{ fontSize: '10px', color: C.textoMudo }}>%</span>
                      </div>
                      <select value={filho.status} onChange={e => mudarStatusTarefa(filho.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: coresStatus[filho.status] || C.textoMudo, color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluido</option>
                      </select>
                      <button onClick={() => deletarTarefa(filho.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '4px' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
