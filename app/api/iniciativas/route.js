import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

function prioridadeParaTexto(n) {
  if (n >= 8) return 'alta'
  if (n >= 4) return 'media'
  return 'baixa'
}

function riceScore(i) {
  const { rice_reach, rice_impact, rice_confidence, rice_effort } = i
  if (!rice_reach || !rice_impact || !rice_confidence || !rice_effort) return null
  return Math.round((rice_reach * rice_impact * rice_confidence / rice_effort) * 10) / 10
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('iniciativas')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) return Response.json({ erro: error.message })
    return Response.json({ iniciativas: (data || []).map(i => ({ ...i, riceScore: riceScore(i) })) })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()

    if (body.importar_csv && Array.isArray(body.iniciativas)) {
      const categoriasValidas = ['ti', 'processos', 'rh', 'financeiro', 'outros']
      const statusValidos = ['backlog', 'em_analise', 'em_andamento', 'concluido']
      const resultado = { criados: 0, atualizados: 0, erros: [] }

      for (const [i, linha] of body.iniciativas.entries()) {
        const titulo = (linha.titulo || '').trim()
        if (!titulo) {
          resultado.erros.push('Linha ' + (i + 2) + ': titulo em branco, ignorada')
          continue
        }
        const dados = {
          titulo,
          descricao: linha.descricao || null,
          categoria: categoriasValidas.includes(linha.categoria) ? linha.categoria : 'outros',
          prioridade: linha.prioridade ? Math.max(1, Math.min(10, Number(linha.prioridade) || 5)) : 5,
          solicitante: linha.solicitante || null,
          responsavel: linha.responsavel || null,
          status: statusValidos.includes(linha.status) ? linha.status : 'backlog'
        }
        const { data: existentes, error: erroBusca } = await supabase
          .from('iniciativas')
          .select('id')
          .ilike('titulo', titulo)
          .limit(1)
        if (erroBusca) {
          resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + erroBusca.message)
          continue
        }
        const existente = existentes && existentes[0]
        if (existente) {
          const { error } = await supabase.from('iniciativas').update(dados).eq('id', existente.id)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + error.message)
          else resultado.atualizados++
        } else {
          const { error } = await supabase.from('iniciativas').insert(dados)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + error.message)
          else resultado.criados++
        }
      }
      return Response.json(resultado)
    }

    if (body.promover && body.id) {
      const { data: iniciativa, error: erroBusca } = await supabase
        .from('iniciativas')
        .select('*')
        .eq('id', body.id)
        .single()
      if (erroBusca) return Response.json({ erro: erroBusca.message })

      const { data: projetoNovo, error: erroProjeto } = await supabase
        .from('projetos')
        .insert({
          titulo: iniciativa.titulo,
          descricao: iniciativa.descricao,
          responsavel: iniciativa.responsavel || iniciativa.solicitante,
          prioridade: prioridadeParaTexto(iniciativa.prioridade),
          status: 'pendente'
        })
        .select()
      if (erroProjeto) return Response.json({ erro: erroProjeto.message })

      const { error: erroUpdate } = await supabase
        .from('iniciativas')
        .update({ projeto_id: projetoNovo[0].id, status: 'concluido' })
        .eq('id', body.id)
      if (erroUpdate) return Response.json({ erro: erroUpdate.message })

      return Response.json({ projeto: projetoNovo[0] })
    }

    const { data, error } = await supabase
      .from('iniciativas')
      .insert({
        titulo: body.titulo,
        descricao: body.descricao || null,
        categoria: body.categoria || 'outros',
        prioridade: body.prioridade || 5,
        solicitante: body.solicitante || null,
        responsavel: body.responsavel || null,
        status: body.status || 'backlog',
        rice_reach: body.rice_reach || null,
        rice_impact: body.rice_impact || null,
        rice_confidence: body.rice_confidence || null,
        rice_effort: body.rice_effort || null
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ iniciativa: { ...data[0], riceScore: riceScore(data[0]) } })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['titulo', 'descricao', 'categoria', 'prioridade', 'solicitante', 'responsavel', 'status', 'rice_reach', 'rice_impact', 'rice_confidence', 'rice_effort']
    const update = {}
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { data, error } = await supabase
      .from('iniciativas')
      .update(update)
      .eq('id', body.id)
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ iniciativa: { ...data[0], riceScore: riceScore(data[0]) } })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('iniciativas').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
