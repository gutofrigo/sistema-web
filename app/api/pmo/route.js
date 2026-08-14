import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

function pctTempoDecorrido(criadoEm, dataPrevistaFim, hoje) {
  const inicio = new Date(criadoEm)
  const fim = new Date(dataPrevistaFim + 'T23:59:59')
  const totalMs = fim - inicio
  if (totalMs <= 0) return 100
  const decorridoMs = hoje - inicio
  return Math.min(Math.max(decorridoMs / totalMs, 0), 1) * 100
}

function calcularRAG(projeto, tarefasProjeto, realizado, riscosProjeto, hoje) {
  const motivos = []

  // Sinal de prazo
  let prazo = 'cinza'
  const totalTarefas = tarefasProjeto.length
  const concluidas = tarefasProjeto.filter(t => t.status === 'concluido').length
  const atrasadas = tarefasProjeto.filter(t => t.data_entrega && t.status !== 'concluido' && new Date(t.data_entrega + 'T23:59:59') < hoje)

  if (projeto.status === 'concluido') {
    prazo = 'verde'
  } else if (!projeto.data_prevista_fim && totalTarefas === 0) {
    prazo = 'cinza'
  } else {
    const prazoEstourado = projeto.data_prevista_fim && hoje > new Date(projeto.data_prevista_fim + 'T23:59:59')
    let gap = null
    if (projeto.data_prevista_fim) {
      const pctTempo = pctTempoDecorrido(projeto.criado_em, projeto.data_prevista_fim, hoje)
      const pctConcluido = totalTarefas > 0 ? (concluidas / totalTarefas) * 100 : 0
      gap = pctTempo - pctConcluido
    }
    if (prazoEstourado || atrasadas.length >= 3 || (gap !== null && gap > 30)) {
      prazo = 'vermelho'
      if (prazoEstourado) motivos.push('Prazo previsto do projeto ja passou')
      if (atrasadas.length >= 3) motivos.push(atrasadas.length + ' tarefas atrasadas')
      if (gap !== null && gap > 30) motivos.push('Ritmo de conclusao muito atras do cronograma (' + Math.round(gap) + 'pp)')
    } else if (atrasadas.length >= 1 || (gap !== null && gap > 15)) {
      prazo = 'ambar'
      if (atrasadas.length >= 1) motivos.push(atrasadas.length + ' tarefa(s) atrasada(s)')
      if (gap !== null && gap > 15) motivos.push('Ritmo de conclusao atras do cronograma (' + Math.round(gap) + 'pp)')
    } else {
      prazo = 'verde'
    }
  }

  // Sinal de orcamento
  let orcamento = 'cinza'
  if (projeto.orcamento) {
    const burnPct = (realizado / projeto.orcamento) * 100
    const expectedPct = projeto.data_prevista_fim ? pctTempoDecorrido(projeto.criado_em, projeto.data_prevista_fim, hoje) : 100
    const diff = burnPct - expectedPct
    if (burnPct > 100 || diff > 20) {
      orcamento = 'vermelho'
      motivos.push('Orcamento ' + Math.round(burnPct) + '% gasto' + (burnPct > 100 ? ' (estourado)' : ''))
    } else if (diff > 10) {
      orcamento = 'ambar'
      motivos.push('Orcamento gasto acima do ritmo esperado (' + Math.round(diff) + 'pp)')
    } else {
      orcamento = 'verde'
    }
  }

  // Sinal de riscos
  const abertos = riscosProjeto.filter(r => r.status === 'aberto')
  const altos = abertos.filter(r => r.impacto === 'alto')
  const medios = abertos.filter(r => r.impacto === 'medio')
  let riscos = 'verde'
  if (altos.length >= 1) {
    riscos = 'vermelho'
    motivos.push(altos.length + ' risco(s) aberto(s) de impacto alto')
  } else if (medios.length >= 2) {
    riscos = 'ambar'
    motivos.push(medios.length + ' riscos abertos de impacto medio')
  } else if (abertos.length >= 1) {
    riscos = 'ambar'
    motivos.push(abertos.length + ' risco(s) aberto(s)')
  }

  const rank = { vermelho: 3, ambar: 2, verde: 1, cinza: 0 }
  const sinais = [prazo, orcamento, riscos]
  const naoCinza = sinais.filter(s => s !== 'cinza')
  const geral = naoCinza.length > 0
    ? naoCinza.reduce((pior, atual) => rank[atual] > rank[pior] ? atual : pior, naoCinza[0])
    : 'cinza'

  return { geral, prazo, orcamento, riscos, motivos }
}

function ultimosMeses(n, hoje) {
  const arr = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    arr.push(d.toISOString().slice(0, 7))
  }
  return arr
}

export async function GET() {
  try {
    const hoje = new Date()

    const [{ data: projetos }, { data: tarefas }, { data: lancamentos }, { data: riscos }, { data: roadmaps }, { data: entrevistas }, { data: iniciativas }] = await Promise.all([
      supabase.from('projetos').select('*').order('criado_em', { ascending: false }),
      supabase.from('tarefas').select('id, projeto_id, titulo, responsavel, status, data_entrega, concluido_em, criado_em'),
      supabase.from('lancamentos').select('projeto_id, valor, tipo, status').eq('status', 'pago').not('projeto_id', 'is', null),
      supabase.from('riscos_projeto').select('*'),
      supabase.from('roadmaps').select('id, projeto_id, titulo').not('projeto_id', 'is', null),
      supabase.from('entrevistas').select('id, processo, responsavel, criado_em').order('criado_em', { ascending: false }).limit(3),
      supabase.from('iniciativas').select('categoria, status')
    ])

    const tarefasPorProjeto = new Map()
    for (const t of tarefas || []) {
      if (!tarefasPorProjeto.has(t.projeto_id)) tarefasPorProjeto.set(t.projeto_id, [])
      tarefasPorProjeto.get(t.projeto_id).push(t)
    }

    const realizadoPorProjeto = new Map()
    for (const l of lancamentos || []) {
      if (l.tipo !== 'saida') continue
      realizadoPorProjeto.set(l.projeto_id, (realizadoPorProjeto.get(l.projeto_id) || 0) + Number(l.valor))
    }

    const riscosPorProjeto = new Map()
    for (const r of riscos || []) {
      if (!riscosPorProjeto.has(r.projeto_id)) riscosPorProjeto.set(r.projeto_id, [])
      riscosPorProjeto.get(r.projeto_id).push(r)
    }

    const roadmapPorProjeto = new Map()
    for (const r of roadmaps || []) {
      if (!roadmapPorProjeto.has(r.projeto_id)) roadmapPorProjeto.set(r.projeto_id, r)
    }

    const rankRag = { vermelho: 3, ambar: 2, verde: 1, cinza: 0 }
    const rankPrioridade = { alta: 3, media: 2, baixa: 1 }

    const projetosOut = (projetos || []).map(projeto => {
      const tarefasP = tarefasPorProjeto.get(projeto.id) || []
      const realizado = realizadoPorProjeto.get(projeto.id) || 0
      const riscosP = riscosPorProjeto.get(projeto.id) || []
      const roadmapP = roadmapPorProjeto.get(projeto.id) || null
      const rag = calcularRAG(projeto, tarefasP, realizado, riscosP, hoje)

      const totalTarefas = tarefasP.length
      const concluidas = tarefasP.filter(t => t.status === 'concluido').length
      const atrasadas = tarefasP.filter(t => t.data_entrega && t.status !== 'concluido' && new Date(t.data_entrega + 'T23:59:59') < hoje).length
      const riscosAbertos = riscosP.filter(r => r.status === 'aberto')

      return {
        id: projeto.id,
        titulo: projeto.titulo,
        responsavel: projeto.responsavel,
        status: projeto.status,
        prioridade: projeto.prioridade || 'media',
        orcamento: projeto.orcamento,
        realizado,
        data_prevista_fim: projeto.data_prevista_fim,
        totalTarefas,
        concluidas,
        pctConcluido: totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0,
        atrasadas,
        rag,
        riscosAbertos: riscosAbertos.length,
        riscosPorSeveridade: {
          baixa: riscosAbertos.filter(r => r.impacto === 'baixo').length,
          media: riscosAbertos.filter(r => r.impacto === 'medio').length,
          alta: riscosAbertos.filter(r => r.impacto === 'alto').length
        },
        roadmap: roadmapP ? { id: roadmapP.id, titulo: roadmapP.titulo } : null
      }
    }).sort((a, b) => (rankRag[b.rag.geral] - rankRag[a.rag.geral]) || (rankPrioridade[b.prioridade] - rankPrioridade[a.prioridade]))

    const resumo = {
      totalProjetos: projetosOut.length,
      emAtencao: projetosOut.filter(p => p.rag.geral === 'ambar' || p.rag.geral === 'vermelho').length,
      porStatus: {
        pendente: projetosOut.filter(p => p.status === 'pendente').length,
        em_andamento: projetosOut.filter(p => p.status === 'em_andamento').length,
        concluido: projetosOut.filter(p => p.status === 'concluido').length
      },
      orcamentoTotal: projetosOut.reduce((s, p) => s + (Number(p.orcamento) || 0), 0),
      realizadoTotal: projetosOut.reduce((s, p) => s + p.realizado, 0),
      riscosAbertos: {
        baixa: projetosOut.reduce((s, p) => s + p.riscosPorSeveridade.baixa, 0),
        media: projetosOut.reduce((s, p) => s + p.riscosPorSeveridade.media, 0),
        alta: projetosOut.reduce((s, p) => s + p.riscosPorSeveridade.alta, 0)
      }
    }

    const mesesArr = ultimosMeses(6, hoje)
    const contagemPorMes = {}
    for (const t of tarefas || []) {
      if (!t.concluido_em) continue
      const mes = t.concluido_em.slice(0, 7)
      contagemPorMes[mes] = (contagemPorMes[mes] || 0) + 1
    }
    const tendencia = mesesArr.map(mes => ({ mes, concluidas: contagemPorMes[mes] || 0 }))

    const em7dias = new Date(hoje)
    em7dias.setDate(hoje.getDate() + 7)
    const tarefasProximas = (tarefas || [])
      .filter(t => t.data_entrega && t.status !== 'concluido' && new Date(t.data_entrega) <= em7dias)
      .sort((a, b) => new Date(a.data_entrega) - new Date(b.data_entrega))
      .slice(0, 5)

    const iniciativasAtivas = (iniciativas || []).filter(i => i.status !== 'concluido')
    const categoriasIniciativas = ['ti', 'processos', 'rh', 'financeiro', 'outros']
    const iniciativasPorCategoria = categoriasIniciativas.map(cat => ({
      categoria: cat,
      qtd: iniciativasAtivas.filter(i => i.categoria === cat).length
    })).filter(c => c.qtd > 0)
    const iniciativasBacklog = iniciativasAtivas.filter(i => i.status === 'backlog').length

    return Response.json({ projetos: projetosOut, resumo, tendencia, tarefasProximas, entrevistasRecentes: entrevistas || [], iniciativasPorCategoria, iniciativasBacklog, iniciativasTotal: iniciativasAtivas.length })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
