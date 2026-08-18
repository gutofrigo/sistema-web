'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'
import { AlertTriangle, Map as MapIcon, ClipboardList, ArrowRight, ArrowLeft } from 'lucide-react'
import AppShell from '../components/AppShell'
import { theme as C, estiloCard } from '../theme'

const corRag = { verde: C.verde, ambar: C.ambar, vermelho: C.vermelho, cinza: C.textoMudo }
const labelRag = { verde: 'No prazo', ambar: 'Atencao', vermelho: 'Critico', cinza: 'Sem dados' }
const labelStatus = { pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluido' }

const CATEGORIAS_INICIATIVA = {
  ti: { label: 'TI / Tecnologia', cor: C.royal },
  processos: { label: 'Processos / Melhoria', cor: C.roxo },
  rh: { label: 'RH / Pessoas', cor: '#0891B2' },
  financeiro: { label: 'Financeiro / Operacoes', cor: '#EA580C' },
  outros: { label: 'Outros', cor: C.textoMudo },
}

function formatarMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

const cardEstilo = { ...estiloCard, padding: '20px' }

export default function PMO() {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    setCarregando(true)
    const res = await fetch('/api/pmo')
    const data = await res.json()
    setDados(data)
    setCarregando(false)
  }

  const voltarInicio = (
    <a href="/inicio" className="btn-ghost-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.branco, border: `1px solid ${C.borda}`, color: C.texto, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
      <ArrowLeft size={14} /> Visao geral
    </a>
  )

  if (carregando) {
    return (
      <AppShell title="PMO — Analise de Portfolio" subtitle="Graficos, riscos e orcamento por projeto" actions={voltarInicio}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: C.textoSec, fontSize: '15px' }}>Carregando painel de PMO...</p>
        </div>
      </AppShell>
    )
  }

  if (!dados || dados.erro) {
    return (
      <AppShell title="PMO — Analise de Portfolio" subtitle="Graficos, riscos e orcamento por projeto" actions={voltarInicio}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: C.vermelho }}>Erro ao carregar dados{dados?.erro ? ': ' + dados.erro : ''}</p>
        </div>
      </AppShell>
    )
  }

  const { projetos, resumo, tendencia, entrevistasRecentes, iniciativasPorCategoria, iniciativasBacklog, iniciativasTotal } = dados

  function diasAtras(data) {
    const diff = Math.floor((new Date() - new Date(data)) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'hoje'
    if (diff === 1) return '1 dia atras'
    return diff + ' dias atras'
  }

  const dadosStatus = [
    { name: 'Pendente', value: resumo.porStatus.pendente, color: C.ambar },
    { name: 'Em andamento', value: resumo.porStatus.em_andamento, color: C.statusInfo },
    { name: 'Concluido', value: resumo.porStatus.concluido, color: C.verde }
  ].filter(d => d.value > 0)

  const dadosOrcamento = projetos
    .filter(p => p.orcamento)
    .map(p => ({ titulo: p.titulo.length > 22 ? p.titulo.slice(0, 22) + '…' : p.titulo, orcado: Number(p.orcamento), realizado: p.realizado, cor: corRag[p.rag.orcamento] || C.royal }))

  const dadosRiscos = [
    { severidade: 'Baixa', qtd: resumo.riscosAbertos.baixa, cor: C.verde },
    { severidade: 'Media', qtd: resumo.riscosAbertos.media, cor: C.ambar },
    { severidade: 'Alta', qtd: resumo.riscosAbertos.alta, cor: C.vermelho }
  ]

  const dadosTendencia = tendencia.map(t => ({ mes: t.mes.slice(5, 7) + '/' + t.mes.slice(2, 4), concluidas: t.concluidas }))

  return (
    <AppShell title="PMO — Analise de Portfolio" subtitle="Graficos, riscos e orcamento por projeto" actions={voltarInicio}>
      <div className="page-pad" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Relatorios + Iniciativas */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card-elevate" style={cardEstilo}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Relatorios recentes</h2>
            {entrevistasRecentes.length === 0 ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum relatorio ainda</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entrevistasRecentes.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: `1px solid ${C.fundo}` }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ClipboardList size={15} color={C.royal} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: C.texto }}>{e.processo}</p>
                      <p style={{ fontSize: '12px', color: C.textoMudo, margin: 0 }}>{e.responsavel} • {diasAtras(e.criado_em)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-elevate" style={cardEstilo}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: 0 }}>Iniciativas por categoria</h2>
              <span style={{ fontSize: '11px', background: '#EEF2FF', color: C.royal, padding: '3px 9px', borderRadius: '20px', fontWeight: 700 }}>{iniciativasBacklog} em backlog</span>
            </div>
            {(!iniciativasPorCategoria || iniciativasPorCategoria.length === 0) ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma iniciativa ativa</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {iniciativasPorCategoria.map(c => {
                  const info = CATEGORIAS_INICIATIVA[c.categoria] || CATEGORIAS_INICIATIVA.outros
                  const pct = iniciativasTotal > 0 ? Math.round((c.qtd / iniciativasTotal) * 100) : 0
                  return (
                    <div key={c.categoria}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textoSec, marginBottom: '4px' }}>
                        <span>{info.label}</span>
                        <span style={{ fontWeight: 700, color: C.texto }}>{c.qtd}</span>
                      </div>
                      <div style={{ height: '6px', background: C.fundo, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: info.cor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <a href="/iniciativas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: C.royal, textDecoration: 'none', fontWeight: 700, paddingTop: '10px', borderTop: `1px solid ${C.fundo}` }}>
              Ver quadro completo <ArrowRight size={13} />
            </a>
          </div>
        </div>

        {/* Graficos */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card-elevate" style={cardEstilo}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Projetos por status</h2>
            {dadosStatus.length === 0 ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>Sem projetos ainda</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dadosStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={d => d.name + ' (' + d.value + ')'}>
                    {dadosStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.branco, border: '1px solid rgba(83,109,136,0.35)', borderRadius: '8px', color: C.texto }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-elevate" style={cardEstilo}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Riscos abertos por severidade</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosRiscos}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borda} />
                <XAxis dataKey="severidade" tick={{ fontSize: 12, fill: C.textoSec }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: C.textoSec }} />
                <Tooltip contentStyle={{ background: C.branco, border: '1px solid rgba(83,109,136,0.35)', borderRadius: '8px', color: C.texto }} />
                <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                  {dadosRiscos.map((d, i) => <Cell key={i} fill={d.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card-elevate" style={cardEstilo}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 16px' }}>Orcado x Realizado por projeto</h2>
            {dadosOrcamento.length === 0 ? (
              <p style={{ color: C.textoMudo, fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>Nenhum projeto com orcamento definido ainda</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, dadosOrcamento.length * 50)}>
                <BarChart data={dadosOrcamento} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borda} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.textoSec }} />
                  <YAxis type="category" dataKey="titulo" width={140} tick={{ fontSize: 11, fill: C.textoSec }} />
                  <Tooltip formatter={v => formatarMoeda(v)} contentStyle={{ background: C.branco, border: '1px solid rgba(83,109,136,0.35)', borderRadius: '8px', color: C.texto }} />
                  <Bar dataKey="orcado" fill={C.borda} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="realizado" radius={[0, 4, 4, 0]}>
                    {dadosOrcamento.map((d, i) => <Cell key={i} fill={d.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-elevate" style={cardEstilo}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: C.texto, margin: '0 0 4px' }}>Tendencia de conclusao de tarefas</h2>
            <p style={{ fontSize: '11px', color: C.textoMudo, margin: '0 0 16px' }}>Ultimos 6 meses — historico comeca a partir da ativacao do PMO</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dadosTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borda} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: C.textoSec }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: C.textoSec }} />
                <Tooltip contentStyle={{ background: C.branco, border: '1px solid rgba(83,109,136,0.35)', borderRadius: '8px', color: C.texto }} />
                <Line type="monotone" dataKey="concluidas" stroke={C.royal} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cards de portfolio */}
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.texto, margin: '8px 0 14px', letterSpacing: '-0.01em' }}>Portfolio de projetos</h2>
        {projetos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: C.branco, borderRadius: '14px', color: C.textoSec, border: `1px solid ${C.borda}` }}>
            <p style={{ fontSize: '15px' }}>Nenhum projeto cadastrado ainda</p>
          </div>
        )}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          {projetos.map(p => {
            const burnPct = p.orcamento ? Math.min(Math.round((p.realizado / p.orcamento) * 100), 999) : null
            return (
              <div key={p.id} className="card-elevate" style={{ ...cardEstilo, padding: '22px', borderLeft: `5px solid ${corRag[p.rag.geral]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', color: C.texto, fontSize: '15px' }}>{p.titulo}</h3>
                    <p style={{ margin: 0, color: C.textoMudo, fontSize: '12px' }}>{p.responsavel || 'Sem responsavel'} • {labelStatus[p.status]}</p>
                  </div>
                  <span style={{ background: corRag[p.rag.geral], color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {labelRag[p.rag.geral]}
                  </span>
                </div>

                {p.rag.motivos.length > 0 && (
                  <details style={{ marginBottom: '10px' }}>
                    <summary style={{ fontSize: '12px', color: C.textoSec, cursor: 'pointer' }}>Por que? ({p.rag.motivos.length})</summary>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '12px', color: C.textoSec }}>
                      {p.rag.motivos.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </details>
                )}

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textoSec, marginBottom: '4px' }}>
                    <span>Tarefas: {p.concluidas}/{p.totalTarefas} ({p.pctConcluido}%)</span>
                    {p.atrasadas > 0 && <span style={{ color: C.vermelho }}>{p.atrasadas} atrasada(s)</span>}
                  </div>
                  <div style={{ height: '6px', background: C.fundo, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: p.pctConcluido + '%', background: C.royal }} />
                  </div>
                </div>

                {p.orcamento ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textoSec, marginBottom: '4px' }}>
                      <span>Orcamento: {formatarMoeda(p.realizado)} de {formatarMoeda(p.orcamento)}</span>
                      <span>{burnPct}%</span>
                    </div>
                    <div style={{ height: '6px', background: C.fundo, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: Math.min(burnPct, 100) + '%', background: corRag[p.rag.orcamento] || C.royal }} />
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: C.textoMudo, margin: '0 0 10px' }}>Sem orcamento definido</p>
                )}

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {p.riscosAbertos > 0 ? (
                    <span style={{ fontSize: '11px', background: '#FEF2F2', color: C.vermelho, padding: '3px 9px', borderRadius: '20px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={11} /> {p.riscosAbertos} risco(s) aberto(s)</span>
                  ) : (
                    <span style={{ fontSize: '11px', background: '#F0FDF4', color: C.verde, padding: '3px 9px', borderRadius: '20px', fontWeight: 'bold' }}>Sem riscos abertos</span>
                  )}
                  {p.roadmap && (
                    <span style={{ fontSize: '11px', background: '#EEF2FF', color: C.royal, padding: '3px 9px', borderRadius: '20px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapIcon size={11} /> Roadmap vinculado</span>
                  )}
                </div>

                <a href={'/projetos?id=' + p.id} style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: C.royal, textDecoration: 'none', fontWeight: 'bold', paddingTop: '10px', borderTop: `1px solid ${C.fundo}` }}>
                  Gerenciar projeto →
                </a>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
