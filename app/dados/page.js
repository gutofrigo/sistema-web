'use client'
import { useState, useEffect } from 'react'
import { Upload, Download, FolderKanban, Kanban, ListChecks, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C } from '../theme'

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

function paraCSV(linhas, colunas) {
  const escapar = v => {
    const s = v === null || v === undefined ? '' : String(v)
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const cabecalho = colunas.join(',')
  const corpo = linhas.map(l => colunas.map(c => escapar(l[c])).join(',')).join('\n')
  return cabecalho + (corpo ? '\n' + corpo : '')
}

function baixarArquivo(nome, conteudo) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

function SecaoEntidade({ config }) {
  const [arquivo, setArquivo] = useState(null)
  const [preview, setPreview] = useState([])
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [importando, setImportando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const Icone = config.icone

  function lidarComArquivo(e) {
    const f = e.target.files[0]
    if (!f) return
    setResultado(null)
    setErro('')
    setArquivo(f.name)
    const leitor = new FileReader()
    leitor.onload = () => {
      const linhas = parseCSV(String(leitor.result))
      if (linhas.length === 0) {
        setErro('Nao foi possivel ler linhas do arquivo. Confira se a primeira linha tem os cabecalhos.')
        setPreview([])
        return
      }
      const colunaChave = config.colunas[config.colunaChaveIdx || 0]
      if (!(colunaChave in linhas[0])) {
        setErro('O arquivo precisa ter uma coluna "' + colunaChave + '".')
        setPreview([])
        return
      }
      setPreview(linhas)
    }
    leitor.readAsText(f, 'utf-8')
  }

  async function importar() {
    setImportando(true)
    const data = await config.importar(preview)
    setResultado(data)
    setImportando(false)
    setPreview([])
    setArquivo(null)
  }

  async function baixarModelo() {
    baixarArquivo('modelo_' + config.chave + '.csv', paraCSV([config.modelo], config.colunas))
  }

  async function baixarDados() {
    setExportando(true)
    const linhas = await config.buscar()
    baixarArquivo(config.chave + '.csv', paraCSV(linhas, config.colunas))
    setExportando(false)
  }

  return (
    <div style={{ background: C.branco, border: `1px solid ${C.borda}`, borderLeft: `3px solid ${config.cor}`, borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 10px rgba(15,23,42,0.07), 0 18px 32px -12px rgba(15,23,42,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: C.texto, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icone size={16} color={config.cor} /> {config.titulo}
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={baixarModelo} style={{ padding: '7px 14px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={13} /> Baixar modelo
          </button>
          <button onClick={baixarDados} disabled={exportando} style={{ padding: '7px 14px', background: C.fundo, color: C.textoSec, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: exportando ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={13} /> {exportando ? 'Gerando...' : 'Baixar dados atuais'}
          </button>
        </div>
      </div>
      <p style={{ color: C.textoSec, fontSize: '12.5px', margin: '0 0 14px' }}>
        Colunas: <strong>{config.colunas.join(', ')}</strong>. {config.dica}
      </p>

      <input type="file" accept=".csv,text/csv" onChange={lidarComArquivo}
        style={{ display: 'block', marginBottom: '12px', fontSize: '13px', color: C.textoSec }} />

      {erro && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px' }}>
          <p style={{ color: C.vermelho, fontSize: '13px', margin: 0 }}>{erro}</p>
        </div>
      )}

      {preview.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '13px', color: C.texto, fontWeight: 700, margin: '0 0 8px' }}>{arquivo} — {preview.length} linha(s) encontrada(s)</p>
          <div style={{ maxHeight: '160px', overflowY: 'auto', border: `1px solid ${C.borda}`, borderRadius: '6px' }}>
            {preview.slice(0, 10).map((linha, i) => (
              <div key={i} style={{ padding: '7px 12px', borderBottom: i < Math.min(preview.length, 10) - 1 ? `1px solid ${C.fundo}` : 'none', fontSize: '12px', color: C.textoSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {config.colunas.slice(0, 3).map(c => linha[c]).filter(Boolean).join(' • ')}
              </div>
            ))}
            {preview.length > 10 && (
              <div style={{ padding: '7px 12px', fontSize: '12px', color: C.textoMudo }}>+ {preview.length - 10} linha(s) a mais</div>
            )}
          </div>
          <button onClick={importar} disabled={importando} className="btn-hover"
            style={{ marginTop: '12px', padding: '9px 18px', background: importando ? C.textoMudo : config.cor, color: 'white', border: 'none', borderRadius: '6px', cursor: importando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
            {importando ? 'Importando...' : 'Importar ' + preview.length + ' registro(s)'}
          </button>
        </div>
      )}

      {resultado && (
        <div style={{ background: '#F0FDF4', border: `1px solid ${C.verde}`, borderRadius: '6px', padding: '12px 14px' }}>
          <p style={{ color: '#14532d', fontSize: '13px', margin: 0, fontWeight: 700 }}>
            {resultado.criados || 0} criado(s), {resultado.atualizados || 0} atualizado(s)
            {resultado.erros && resultado.erros.length > 0 ? ', ' + resultado.erros.length + ' erro(s)' : ''}
          </p>
          {resultado.erros && resultado.erros.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: C.vermelho }}>
              {resultado.erros.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dados() {
  const [projetosLista, setProjetosLista] = useState([])
  const [projetosMap, setProjetosMap] = useState(new Map())

  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => {
      const lista = d.projetos || []
      setProjetosLista(lista)
      setProjetosMap(new Map(lista.map(p => [p.id, p.titulo])))
    })
  }, [])

  const ENTIDADES = [
    {
      chave: 'projetos', titulo: 'Projetos', icone: FolderKanban, cor: C.royal,
      colunas: ['titulo', 'responsavel', 'descricao', 'orcamento', 'data_prevista_fim', 'prioridade', 'status', 'area', 'progresso', 'em_risco'],
      modelo: { titulo: 'Migracao para nuvem AWS', responsavel: 'Carlos Mendes', descricao: 'Migrar infraestrutura para AWS', orcamento: '180000', data_prevista_fim: '2026-12-31', prioridade: 'alta', status: 'em_andamento', area: 'Infraestrutura', progresso: '25', em_risco: 'false' },
      dica: 'Se o titulo ja existir, o projeto e atualizado; senao, e criado.',
      buscar: async () => projetosLista,
      importar: async linhas => {
        const r = await fetch('/api/projetos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importar_csv: true, projetos: linhas }) })
        return r.json()
      }
    },
    {
      chave: 'iniciativas', titulo: 'Iniciativas', icone: Kanban, cor: C.roxo,
      colunas: ['titulo', 'descricao', 'categoria', 'prioridade', 'solicitante', 'responsavel', 'status'],
      modelo: { titulo: 'Padronizar template de relatorio', descricao: 'Reduzir retrabalho em relatorios mensais', categoria: 'processos', prioridade: '7', solicitante: 'Ana Lima', responsavel: 'Bruno Costa', status: 'backlog' },
      dica: 'categoria: ti/processos/rh/financeiro/outros. status: backlog/em_analise/em_andamento/concluido. Se o titulo ja existir, e atualizado.',
      buscar: async () => {
        const r = await fetch('/api/iniciativas')
        const d = await r.json()
        return d.iniciativas || []
      },
      importar: async linhas => {
        const r = await fetch('/api/iniciativas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importar_csv: true, iniciativas: linhas }) })
        return r.json()
      }
    },
    {
      chave: 'tarefas', titulo: 'Tarefas', icone: ListChecks, cor: C.statusInfo,
      colunas: ['projeto', 'titulo', 'responsavel', 'status', 'progresso', 'data_inicio', 'data_entrega'],
      modelo: { projeto: 'Migracao para nuvem AWS', titulo: 'Levantar inventario de servidores', responsavel: 'Carlos Mendes', status: 'em_andamento', progresso: '40', data_inicio: '2026-01-10', data_entrega: '2026-02-01' },
      dica: 'A coluna "projeto" deve ter o titulo exato de um projeto ja cadastrado. Tarefas-pai apenas (sem subtarefas via CSV).',
      colunaChaveIdx: 1,
      buscar: async () => {
        const r = await fetch('/api/tarefas')
        const d = await r.json()
        return (d.tarefas || []).map(t => ({ ...t, projeto: projetosMap.get(t.projeto_id) || '' }))
      },
      importar: async linhas => {
        const r = await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importar_csv: true, tarefas: linhas }) })
        return r.json()
      }
    },
    {
      chave: 'riscos', titulo: 'Riscos', icone: AlertTriangle, cor: C.vermelho,
      colunas: ['projeto', 'descricao', 'categoria', 'probabilidade', 'impacto', 'mitigacao', 'responsavel', 'status'],
      modelo: { projeto: 'Migracao para nuvem AWS', descricao: 'Atraso na aprovacao orcamentaria', categoria: 'Financeiro', probabilidade: 'media', impacto: 'alto', mitigacao: 'Antecipar aprovacao com 60 dias', responsavel: 'Carlos Mendes', status: 'aberto' },
      dica: 'A coluna "projeto" deve ter o titulo exato de um projeto ja cadastrado. probabilidade/impacto: baixa-baixo/media-medio/alta-alto. status: aberto/mitigado/fechado.',
      colunaChaveIdx: 1,
      buscar: async () => {
        const r = await fetch('/api/riscos')
        const d = await r.json()
        return (d.riscos || []).map(rr => ({ ...rr, projeto: projetosMap.get(rr.projeto_id) || '' }))
      },
      importar: async linhas => {
        const r = await fetch('/api/riscos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importar_csv: true, riscos: linhas }) })
        return r.json()
      }
    },
  ]

  return (
    <AppShell title="Dados" subtitle="Upload e download de informacoes do sistema">
      <div className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <p style={{ color: C.textoSec, fontSize: '13.5px', margin: '0 0 20px' }}>
          Baixe o modelo de cada area, preencha e importe de volta — registros existentes sao atualizados (upsert) e novos sao criados. Tambem e possivel baixar os dados atuais para conferencia ou backup.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {ENTIDADES.map(ent => <SecaoEntidade key={ent.chave} config={ent} />)}
        </div>
      </div>
    </AppShell>
  )
}
