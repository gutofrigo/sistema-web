'use client'
import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Eye, Pencil, Paperclip, Download, ArrowLeft, Save } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C, estiloCard } from '../theme'

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
function markdownParaHtml(texto) {
  if (!texto) return '<p style="color:#93A0B4">Nada escrito ainda.</p>'
  const linhas = escapeHtml(texto).split('\n')
  let html = ''
  let emLista = false
  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim()
    let m
    if ((m = linha.match(/^(#{1,3})\s+(.*)$/))) {
      if (emLista) { html += '</ul>'; emLista = false }
      const nivel = m[1].length + 2
      html += `<h${nivel} style="margin:16px 0 6px">${inline(m[2])}</h${nivel}>`
      continue
    }
    if ((m = linha.match(/^-\s+\[([ xX])\]\s+(.*)$/))) {
      if (!emLista) { html += '<ul style="list-style:none;padding-left:4px;margin:6px 0">'; emLista = true }
      const marcado = m[1].toLowerCase() === 'x'
      html += `<li style="margin:4px 0"><input type="checkbox" disabled ${marcado ? 'checked' : ''} style="margin-right:6px" />${inline(m[2])}</li>`
      continue
    }
    if ((m = linha.match(/^[-*]\s+(.*)$/))) {
      if (!emLista) { html += '<ul style="margin:6px 0; padding-left:20px">'; emLista = true }
      html += `<li style="margin:4px 0">${inline(m[1])}</li>`
      continue
    }
    if (emLista) { html += '</ul>'; emLista = false }
    if (linha === '') { html += '<div style="height:8px"></div>'; continue }
    html += `<p style="margin:6px 0">${inline(linha)}</p>`
  }
  if (emLista) html += '</ul>'
  return html
}

function base64ParaBlob(dataUrl, tipo) {
  const partes = dataUrl.split(',')
  const dados = partes.length > 1 ? partes[1] : partes[0]
  const binario = atob(dados)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return new Blob([bytes], { type: tipo || 'application/octet-stream' })
}
function formatarTamanho(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Notas() {
  const [tela, setTela] = useState('lista')
  const [notas, setNotas] = useState([])
  const [projetos, setProjetos] = useState([])
  const [notaAtiva, setNotaAtiva] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [visualizar, setVisualizar] = useState(false)
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)

  useEffect(() => { buscarNotas(); buscarProjetos() }, [])

  async function buscarNotas() {
    setCarregando(true)
    const res = await fetch('/api/notas')
    const data = await res.json()
    if (data.notas) setNotas(data.notas)
    setCarregando(false)
  }
  async function buscarProjetos() {
    const res = await fetch('/api/projetos')
    const data = await res.json()
    if (data.projetos) setProjetos(data.projetos)
  }
  async function buscarArquivos(notaId) {
    const res = await fetch('/api/notas-arquivos?nota_id=' + notaId)
    const data = await res.json()
    if (data.arquivos) setArquivos(data.arquivos)
  }

  async function criarNota() {
    const res = await fetch('/api/notas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: 'Nova nota', conteudo: '' }) })
    const data = await res.json()
    if (data.erro) return alert('Erro ao criar nota: ' + data.erro)
    await abrirNota(data.nota)
    setVisualizar(false)
  }

  async function abrirNota(nota) {
    const res = await fetch('/api/notas?id=' + nota.id)
    const data = await res.json()
    if (data.erro) return alert('Erro ao abrir nota: ' + data.erro)
    setNotaAtiva(data.nota)
    await buscarArquivos(nota.id)
    setVisualizar(true)
    setTela('nota')
  }

  async function salvarNota() {
    setSalvando(true)
    const res = await fetch('/api/notas', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notaAtiva.id, titulo: notaAtiva.titulo, conteudo: notaAtiva.conteudo, projeto_id: notaAtiva.projeto_id || null })
    })
    const data = await res.json()
    setSalvando(false)
    if (data.erro) return alert('Erro ao salvar: ' + data.erro)
    buscarNotas()
  }

  async function deletarNota(id) {
    if (!confirm('Deletar esta nota e seus anexos?')) return
    const res = await fetch('/api/notas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await res.json()
    if (data.erro) return alert('Erro ao deletar: ' + data.erro)
    setTela('lista')
    setNotaAtiva(null)
    buscarNotas()
  }

  function lidarComArquivo(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    if (arquivo.size > 4 * 1024 * 1024) { alert('Arquivo maior que 4MB. Escolha um arquivo menor.'); e.target.value = ''; return }
    setEnviandoArquivo(true)
    const leitor = new FileReader()
    leitor.onload = async () => {
      const res = await fetch('/api/notas-arquivos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota_id: notaAtiva.id, nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size, conteudo_base64: String(leitor.result) })
      })
      const data = await res.json()
      setEnviandoArquivo(false)
      e.target.value = ''
      if (data.erro) return alert('Erro ao anexar arquivo: ' + data.erro)
      buscarArquivos(notaAtiva.id)
    }
    leitor.readAsDataURL(arquivo)
  }

  async function baixarArquivo(arquivo) {
    const res = await fetch('/api/notas-arquivos?id=' + arquivo.id)
    const data = await res.json()
    if (data.erro || !data.arquivo) return alert('Erro ao baixar arquivo')
    const blob = base64ParaBlob(data.arquivo.conteudo_base64, data.arquivo.tipo)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = data.arquivo.nome
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deletarArquivo(id) {
    if (!confirm('Remover este anexo?')) return
    await fetch('/api/notas-arquivos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    buscarArquivos(notaAtiva.id)
  }

  const inputStyle = { width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: C.texto }

  function nomeProjeto(id) {
    const p = projetos.find(p => p.id === id)
    return p ? p.titulo : null
  }

  // ── TELA: Lista ─────────────────────────────────────────────────────────────
  if (tela === 'lista') return (
    <AppShell
      title="Notas"
      subtitle="Informacoes e arquivos livres"
      actions={
        <button onClick={criarNota} className="btn-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Nova nota
        </button>
      }
    >
      <div className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {carregando ? (
          <p style={{ color: C.textoSec, fontSize: '14px' }}>Carregando notas...</p>
        ) : notas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '14px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <FileText size={32} color={C.textoMudo} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '15px' }}>Nenhuma nota ainda. Clique em "Nova nota" para comecar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notas.map(n => (
              <div key={n.id} onClick={() => abrirNota(n)} className="card-elevate" style={{ ...estiloCard, padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} color={C.royal} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, color: C.texto, fontSize: '14px' }}>{n.titulo}</p>
                    <p style={{ margin: 0, color: C.textoMudo, fontSize: '12px' }}>
                      {nomeProjeto(n.projeto_id) && <span style={{ color: C.royal, fontWeight: 600 }}>{nomeProjeto(n.projeto_id)} • </span>}
                      Atualizado em {formatarData(n.atualizado_em)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )

  // ── TELA: Nota (editor) ────────────────────────────────────────────────────
  if (tela === 'nota' && notaAtiva) return (
    <AppShell
      title={notaAtiva.titulo || 'Nota'}
      subtitle="Notas"
      actions={
        <>
          <button onClick={() => setTela('lista')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <ArrowLeft size={14} /> Notas
          </button>
          <button onClick={() => setVisualizar(!visualizar)} className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {visualizar ? <Pencil size={14} /> : <Eye size={14} />} {visualizar ? 'Editar' : 'Visualizar'}
          </button>
          <button onClick={() => deletarNota(notaAtiva.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: C.vermelho, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Trash2 size={14} /> Deletar
          </button>
          <button onClick={salvarNota} disabled={salvando} className="btn-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: salvando ? C.textoMudo : C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer' }}>
            <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '820px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <div style={{ ...estiloCard, padding: '28px', marginBottom: '16px' }}>
          <input
            value={notaAtiva.titulo}
            onChange={e => setNotaAtiva({ ...notaAtiva, titulo: e.target.value })}
            placeholder="Titulo da nota"
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '22px', fontWeight: 800, color: C.texto, marginBottom: '10px', fontFamily: 'inherit' }}
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: C.textoSec }}>Vincular a um projeto (opcional)</label>
            <select value={notaAtiva.projeto_id || ''} onChange={e => setNotaAtiva({ ...notaAtiva, projeto_id: e.target.value || null })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginTop: '4px' }}>
              <option value="">Nenhum projeto</option>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
          </div>

          {visualizar ? (
            <div style={{ minHeight: '260px', color: C.texto, fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: markdownParaHtml(notaAtiva.conteudo) }} />
          ) : (
            <>
              <textarea
                value={notaAtiva.conteudo || ''}
                onChange={e => setNotaAtiva({ ...notaAtiva, conteudo: e.target.value })}
                placeholder={'Escreva em markdown simples:\n# Titulo\n**negrito**  *italico*\n- item de lista\n- [ ] tarefa pendente\n- [x] tarefa feita'}
                rows={14}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
              />
              <p style={{ fontSize: '11px', color: C.textoMudo, margin: '8px 0 0' }}># titulo &bull; **negrito** &bull; *italico* &bull; - lista &bull; - [ ] checklist</p>
            </>
          )}
        </div>

        <div style={estiloCard}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.borda}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.texto, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={16} color={C.royal} /> Anexos
            </h2>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {enviandoArquivo ? 'Enviando...' : 'Anexar arquivo'}
              <input type="file" onChange={lidarComArquivo} disabled={enviandoArquivo} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ padding: '16px 24px' }}>
            {arquivos.length === 0 ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', margin: 0 }}>Nenhum arquivo anexado. Limite de 4MB por arquivo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {arquivos.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.fundo}` }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: C.texto }}>{a.nome}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: C.textoMudo }}>{formatarTamanho(a.tamanho)} • {formatarData(a.criado_em)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => baixarArquivo(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.royal, padding: '4px' }} title="Baixar"><Download size={15} /></button>
                      <button onClick={() => deletarArquivo(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, padding: '4px' }} title="Remover"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
