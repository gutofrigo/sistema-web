'use client'
import { useState, useEffect } from 'react'
import { BarChart3, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C, estiloCard, estiloEyebrow, estiloStatNumero } from '../theme'

const CATEGORIAS = ['moradia', 'alimentacao', 'saude', 'transporte', 'lazer', 'salario', 'outros']
const NOMES_MES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function fmt(valor) {
  return 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtData(data) {
  if (!data) return ''
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}
function mesStr(mes, ano) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}`
}

export default function Financeiro() {
  const hoje = new Date()
  const [tela, setTela] = useState('lista')
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [lancamentos, setLancamentos] = useState([])
  const [resumo, setResumo] = useState({ entradas: 0, saidas: 0, saldo: 0 })
  const [proximosPagamentos, setProximosPagamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [totais, setTotais] = useState(null)
  const [carregandoTotais, setCarregandoTotais] = useState(false)
  const [form, setForm] = useState({
    descricao: '', valor: '', tipo: 'saida', categoria: 'outros',
    data_venc: hoje.toISOString().slice(0, 10), recorrente: false, projeto_id: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [projetos, setProjetos] = useState([])

  useEffect(() => { buscarDados() }, [mes, ano])
  useEffect(() => { buscarProjetos() }, [])

  async function buscarProjetos() {
    const res = await fetch('/api/projetos')
    const data = await res.json()
    if (data.projetos) setProjetos(data.projetos)
  }

  async function buscarDados() {
    setCarregando(true)
    setDiaSelecionado(null)
    const res = await fetch(`/api/financeiro?mes=${mesStr(mes, ano)}`)
    const data = await res.json()
    if (!data.erro) {
      setLancamentos(data.lancamentos || [])
      setResumo(data.resumo || { entradas: 0, saidas: 0, saldo: 0 })
      setProximosPagamentos(data.proximosPagamentos || [])
    }
    setCarregando(false)
  }

  async function abrirTotais() {
    setCarregandoTotais(true)
    setTela('totais')
    const res = await fetch('/api/financeiro?view=totais')
    const data = await res.json()
    if (!data.erro) setTotais(data)
    setCarregandoTotais(false)
  }

  async function salvar() {
    if (!form.descricao || !form.valor || !form.data_venc) return alert('Preencha todos os campos obrigatorios')
    setSalvando(true)
    const res = await fetch('/api/financeiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.erro) { alert('Erro: ' + data.erro); setSalvando(false); return }
    setForm({ descricao: '', valor: '', tipo: 'saida', categoria: 'outros', data_venc: new Date().toISOString().slice(0, 10), recorrente: false, projeto_id: '' })
    setTela('lista')
    buscarDados()
    setSalvando(false)
  }

  async function marcarPago(id) {
    await fetch('/api/financeiro', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pago' })
    })
    buscarDados()
  }

  async function deletar(id) {
    if (!confirm('Deletar este lancamento?')) return
    await fetch('/api/financeiro', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    buscarDados()
  }

  function navMes(dir) {
    let novoMes = mes + dir
    let novoAno = ano
    if (novoMes < 0) { novoMes = 11; novoAno-- }
    if (novoMes > 11) { novoMes = 0; novoAno++ }
    setMes(novoMes)
    setAno(novoAno)
  }

  function lancamentosNoDia(dia) {
    const dStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return lancamentos.filter(l => l.data_venc === dStr)
  }

  const btnHeader = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: C.fundo, border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.texto, fontSize: '13px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }

  // ── TELA: Novo lancamento ──────────────────────────────────────────────────
  if (tela === 'novo') return (
    <AppShell title="Novo Lancamento" subtitle="Financeiro" actions={<button onClick={() => setTela('lista')} style={btnHeader}>← Voltar</button>}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
        <div style={{ background: C.branco, borderRadius: '10px', padding: '32px', width: '100%', maxWidth: '560px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)' }}>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => setForm({ ...form, tipo: 'saida' })} style={{ flex: 1, padding: '11px', background: form.tipo === 'saida' ? C.vermelho : C.fundo, color: form.tipo === 'saida' ? 'white' : C.textoSec, border: `1px solid ${form.tipo === 'saida' ? C.vermelho : C.borda}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ArrowUp size={14} /> Saida
            </button>
            <button onClick={() => setForm({ ...form, tipo: 'entrada' })} style={{ flex: 1, padding: '11px', background: form.tipo === 'entrada' ? C.verde : C.fundo, color: form.tipo === 'entrada' ? 'white' : C.textoSec, border: `1px solid ${form.tipo === 'entrada' ? C.verde : C.borda}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ArrowDown size={14} /> Entrada
            </button>
          </div>

          <input placeholder="Descricao (ex: Aluguel, Salario, Mercado)" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
            style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }} />
          <input type="number" placeholder="Valor (ex: 1500.00)" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })}
            style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }} />
          <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
            style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: C.textoSec, display: 'block', marginBottom: '4px' }}>Data de vencimento / recebimento</label>
            <input type="date" value={form.data_venc} onChange={e => setForm({ ...form, data_venc: e.target.value })}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: C.textoSec, display: 'block', marginBottom: '4px' }}>Projeto (opcional)</label>
            <select value={form.projeto_id} onChange={e => setForm({ ...form, projeto_id: e.target.value })}
              style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', color: C.texto }}>
              <option value="">Nenhum projeto vinculado</option>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '24px', fontSize: '14px', color: C.texto, padding: '12px', background: form.recorrente ? '#EEF2FF' : C.fundo, borderRadius: '6px', border: `1px solid ${form.recorrente ? C.royal : C.borda}` }}>
            <input type="checkbox" checked={form.recorrente} onChange={e => setForm({ ...form, recorrente: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: C.royal }} />
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Lancamento recorrente</p>
              <p style={{ margin: 0, fontSize: '12px', color: C.textoSec }}>Gera automaticamente os proximos 12 meses, um de cada vez para confirmar</p>
            </div>
          </label>

          <button onClick={salvar} disabled={salvando}
            style={{ width: '100%', padding: '13px', background: salvando ? C.textoMudo : C.royal, color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {salvando ? 'Salvando...' : 'Salvar Lancamento'}
          </button>
        </div>
      </div>
    </AppShell>
  )

  // ── TELA: Totais por categoria ─────────────────────────────────────────────
  if (tela === 'totais') return (
    <AppShell title="Totais por categoria" subtitle="Financeiro" actions={<button onClick={() => setTela('lista')} style={btnHeader}>← Voltar</button>}>
      <div className="page-pad" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {carregandoTotais && <div style={{ textAlign: 'center', padding: '60px', color: C.textoMudo }}>Carregando totais...</div>}

        {!carregandoTotais && totais && (
          <>
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div style={{ background: C.branco, borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.verde}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 6px' }}>Total recebido (todos os meses)</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: C.verde, margin: 0 }}>{fmt(totais.totalGeral.entradas)}</p>
              </div>
              <div style={{ background: C.branco, borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.vermelho}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 6px' }}>Total gasto (todos os meses)</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: C.vermelho, margin: 0 }}>{fmt(totais.totalGeral.saidas)}</p>
              </div>
              <div style={{ background: C.branco, borderRadius: '8px', padding: '20px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <p style={{ color: C.textoSec, fontSize: '12px', margin: '0 0 6px' }}>Saldo acumulado</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: totais.totalGeral.saldo >= 0 ? C.verde : C.vermelho, margin: 0 }}>{fmt(totais.totalGeral.saldo)}</p>
              </div>
            </div>

            <div style={{ background: C.branco, borderRadius: '8px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.borda}` }}>
                <h2 style={{ color: C.texto, margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Gasto acumulado por categoria</h2>
                <p style={{ color: C.textoMudo, fontSize: '12px', margin: '4px 0 0' }}>Considera apenas lancamentos com status pago/recebido</p>
              </div>
              {totais.porCategoria.length === 0 && (
                <p style={{ padding: '40px', textAlign: 'center', color: C.textoMudo, fontSize: '14px' }}>Nenhum lancamento pago registrado ainda</p>
              )}
              {totais.porCategoria.map((cat, i) => {
                const maxSaida = Math.max(...totais.porCategoria.map(c => c.saidas), 1)
                const pct = (cat.saidas / maxSaida) * 100
                return (
                  <div key={cat.categoria} style={{ padding: '18px 24px', borderBottom: i < totais.porCategoria.length - 1 ? `1px solid ${C.fundo}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: C.texto, textTransform: 'capitalize' }}>{cat.categoria}</span>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                        {cat.entradas > 0 && <span style={{ color: C.verde, fontWeight: 'bold' }}>+{fmt(cat.entradas)}</span>}
                        {cat.saidas > 0 && <span style={{ color: C.vermelho, fontWeight: 'bold' }}>-{fmt(cat.saidas)}</span>}
                      </div>
                    </div>
                    {cat.saidas > 0 && (
                      <div style={{ background: C.fundo, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: C.royal, borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )

  // ── TELA: Lista principal ──────────────────────────────────────────────────
  const corSaldo = resumo.saldo >= 0 ? C.verde : C.vermelho
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const celulasCal = []
  for (let i = 0; i < primeiroDia; i++) celulasCal.push(null)
  for (let i = 1; i <= totalDias; i++) celulasCal.push(i)
  const lancamentosDiaSel = diaSelecionado ? lancamentosNoDia(diaSelecionado) : []

  return (
    <AppShell
      title="Financeiro"
      subtitle="Sistema de Melhoria"
      actions={
        <>
          <button onClick={abrirTotais} className="btn-ghost-hover" style={{ ...btnHeader, background: C.branco }}><BarChart3 size={14} /> Totais</button>
          <button onClick={() => setTela('novo')} className="btn-hover" style={{ ...btnHeader, background: C.royal, color: C.textoSobreAccent, border: 'none' }}><Plus size={14} /> Novo</button>
        </>
      }
    >
      <div className="page-pad" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Navegacao de mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => navMes(-1)} style={{ padding: '6px 14px', background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', color: C.royal, fontWeight: 'bold', fontSize: '18px', lineHeight: 1 }}>‹</button>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: C.texto, minWidth: '170px', textAlign: 'center' }}>{NOMES_MES[mes]} {ano}</span>
          <button onClick={() => navMes(1)} style={{ padding: '6px 14px', background: C.branco, border: `1px solid ${C.borda}`, borderRadius: '6px', cursor: 'pointer', color: C.royal, fontWeight: 'bold', fontSize: '18px', lineHeight: 1 }}>›</button>
        </div>

        {/* Cards resumo mensal */}
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <div className="card-elevate" style={{ ...estiloCard, padding: '22px', borderTop: `4px solid ${C.verde}` }}>
            <p style={estiloEyebrow}>Entradas no mes (pagas)</p>
            <p style={{ ...estiloStatNumero, fontSize: '26px', color: C.verde }}>{fmt(resumo.entradas)}</p>
          </div>
          <div className="card-elevate" style={{ ...estiloCard, padding: '22px', borderTop: `4px solid ${C.vermelho}` }}>
            <p style={estiloEyebrow}>Saidas no mes (pagas)</p>
            <p style={{ ...estiloStatNumero, fontSize: '26px', color: C.vermelho }}>{fmt(resumo.saidas)}</p>
          </div>
          <div className="card-elevate" style={{ ...estiloCard, padding: '22px', borderTop: `4px solid ${corSaldo}` }}>
            <p style={estiloEyebrow}>Saldo do mes</p>
            <p style={{ ...estiloStatNumero, fontSize: '26px', color: corSaldo }}>{fmt(resumo.saldo)}</p>
          </div>
        </div>

        {/* Calendario + Proximos pagamentos */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>

          {/* Calendario */}
          <div style={{ background: C.branco, borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: C.texto, fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px' }}>Calendario</h2>
            {carregando ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Carregando...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
                  {DIAS_SEMANA.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: C.textoMudo, fontWeight: 'bold', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {celulasCal.map((dia, i) => {
                    if (!dia) return <div key={i} />
                    const itens = lancamentosNoDia(dia)
                    const temPendenteS = itens.some(l => l.status === 'pendente' && l.tipo === 'saida')
                    const temPagoS = itens.some(l => l.status === 'pago' && l.tipo === 'saida')
                    const temEntrada = itens.some(l => l.tipo === 'entrada')
                    const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
                    const isSel = diaSelecionado === dia
                    return (
                      <div key={i} onClick={() => setDiaSelecionado(isSel ? null : dia)}
                        style={{ textAlign: 'center', padding: '5px 2px', borderRadius: '6px', cursor: itens.length > 0 ? 'pointer' : 'default', background: isSel ? C.navy : isHoje ? '#EEF2FF' : 'transparent', border: isHoje && !isSel ? `1px solid ${C.borda}` : '1px solid transparent' }}>
                        <span style={{ fontSize: '12px', color: isSel ? 'white' : C.texto, fontWeight: isHoje ? 'bold' : 'normal' }}>{dia}</span>
                        {itens.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                            {temPendenteS && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.ambar }} />}
                            {temPagoS && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.verde }} />}
                            {temEntrada && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.royal }} />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {diaSelecionado && (
                  <div style={{ marginTop: '14px', borderTop: `1px solid ${C.borda}`, paddingTop: '14px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: C.texto, margin: '0 0 10px' }}>
                      {String(diaSelecionado).padStart(2, '0')}/{String(mes + 1).padStart(2, '0')}/{ano}
                    </p>
                    {lancamentosDiaSel.length === 0 && <p style={{ color: C.textoMudo, fontSize: '13px' }}>Nenhum lancamento</p>}
                    {lancamentosDiaSel.map(l => (
                      <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.fundo}` }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: C.texto, margin: '0 0 1px' }}>{l.descricao}</p>
                          <p style={{ fontSize: '11px', color: C.textoMudo, margin: 0, textTransform: 'capitalize' }}>{l.categoria}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: l.tipo === 'entrada' ? C.verde : C.vermelho }}>
                            {l.tipo === 'entrada' ? '+' : '-'}{fmt(l.valor)}
                          </span>
                          {l.status === 'pendente' && (
                            <button onClick={() => marcarPago(l.id)} style={{ fontSize: '11px', padding: '3px 8px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                              {l.tipo === 'entrada' ? 'Receber' : 'Pagar'}
                            </button>
                          )}
                          {l.status === 'pago' && (
                            <span style={{ fontSize: '11px', color: C.verde, fontWeight: 'bold' }}>✓ {l.tipo === 'entrada' ? 'Recebido' : 'Pago'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.fundo}`, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.ambar }} /><span style={{ fontSize: '11px', color: C.textoMudo }}>Saida pendente</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.verde }} /><span style={{ fontSize: '11px', color: C.textoMudo }}>Saida paga</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.royal }} /><span style={{ fontSize: '11px', color: C.textoMudo }}>Entrada</span></div>
                </div>
              </>
            )}
          </div>

          {/* Proximos pagamentos */}
          <div style={{ background: C.branco, borderRadius: '8px', padding: '24px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.ambar}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: C.texto, fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px' }}>Proximos pagamentos pendentes</h2>
            {proximosPagamentos.length === 0 && (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nenhum pagamento pendente este mes 🎉</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {proximosPagamentos.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: `1px solid ${C.fundo}` }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: C.texto, margin: '0 0 2px' }}>{l.descricao}</p>
                    <p style={{ fontSize: '11px', color: C.textoMudo, margin: 0, textTransform: 'capitalize' }}>{l.categoria} • {fmtData(l.data_venc)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: l.tipo === 'saida' ? C.vermelho : C.verde }}>
                      {l.tipo === 'entrada' ? '+' : ''}{fmt(l.valor)}
                    </span>
                    <button onClick={() => marcarPago(l.id)} style={{ fontSize: '11px', padding: '4px 10px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {l.tipo === 'entrada' ? 'Receber' : 'Pagar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de lancamentos */}
        <div style={{ background: C.branco, borderRadius: '8px', border: `1px solid ${C.borda}`, borderLeft: `3px solid ${C.royal}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.borda}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: C.texto, margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Lancamentos de {NOMES_MES[mes]}</h2>
            <span style={{ fontSize: '12px', color: C.textoMudo }}>{lancamentos.length} lancamento(s)</span>
          </div>
          {carregando && <p style={{ padding: '40px', textAlign: 'center', color: C.textoMudo }}>Carregando...</p>}
          {!carregando && lancamentos.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: C.textoMudo, fontSize: '14px' }}>
              Nenhum lancamento neste mes. Clique em <strong style={{ color: C.texto }}>+ Novo</strong> para comecar.
            </div>
          )}
          {!carregando && lancamentos.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                <thead>
                  <tr style={{ background: C.fundo }}>
                    {['Descricao', 'Categoria', 'Data', 'Status', 'Valor', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: C.textoSec, fontWeight: 'bold', borderBottom: `1px solid ${C.borda}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map(l => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${C.fundo}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '13px', color: C.texto, fontWeight: 'bold' }}>{l.descricao}</span>
                        {l.recorrente && (
                          <span style={{ marginLeft: '6px', fontSize: '10px', background: '#EEF2FF', color: C.royal, padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>recorrente</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: C.textoSec, textTransform: 'capitalize' }}>{l.categoria}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: C.textoSec }}>{fmtData(l.data_venc)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold', background: l.status === 'pago' ? '#f0fdf4' : '#fffbeb', color: l.status === 'pago' ? '#166534' : '#92400e' }}>
                          {l.status === 'pago' ? (l.tipo === 'entrada' ? 'Recebido' : 'Pago') : 'Pendente'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', color: l.tipo === 'entrada' ? C.verde : C.vermelho }}>
                        {l.tipo === 'entrada' ? '+' : '-'}{fmt(l.valor)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {l.status === 'pendente' && (
                            <button onClick={() => marcarPago(l.id)} style={{ fontSize: '11px', padding: '4px 10px', background: C.royal, color: C.textoSobreAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {l.tipo === 'entrada' ? 'Receber' : 'Pagar'}
                            </button>
                          )}
                          <button onClick={() => deletar(l.id)} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: C.textoMudo, display: 'inline-flex' }} title="Deletar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
