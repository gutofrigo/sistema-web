import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
export async function GET(req) {
  try {
    const url = new URL(req.url)
    const projetoId = url.searchParams.get('projeto_id')
    let query = supabase.from('riscos_projeto').select('*').order('criado_em', { ascending: false })
    if (projetoId) query = query.eq('projeto_id', projetoId)
    const { data, error } = await query
    if (error) return Response.json({ erro: error.message })
    return Response.json({ riscos: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function POST(req) {
  try {
    const body = await req.json()

    if (body.importar_csv && Array.isArray(body.riscos)) {
      const probabilidadesValidas = ['baixa', 'media', 'alta']
      const impactosValidos = ['baixo', 'medio', 'alto']
      const statusValidos = ['aberto', 'mitigado', 'fechado']
      const resultado = { criados: 0, atualizados: 0, erros: [] }

      const { data: projetos, error: erroProjetos } = await supabase.from('projetos').select('id, titulo')
      if (erroProjetos) return Response.json({ erro: erroProjetos.message })
      const projetoPorTitulo = new Map((projetos || []).map(p => [p.titulo.trim().toLowerCase(), p.id]))

      for (const [i, linha] of body.riscos.entries()) {
        const descricao = (linha.descricao || '').trim()
        const nomeProjeto = (linha.projeto || '').trim()
        if (!descricao || !nomeProjeto) {
          resultado.erros.push('Linha ' + (i + 2) + ': projeto e descricao sao obrigatorios')
          continue
        }
        const projetoId = projetoPorTitulo.get(nomeProjeto.toLowerCase())
        if (!projetoId) {
          resultado.erros.push('Linha ' + (i + 2) + ': projeto "' + nomeProjeto + '" nao encontrado')
          continue
        }
        const dados = {
          projeto_id: projetoId,
          descricao,
          categoria: linha.categoria || null,
          probabilidade: probabilidadesValidas.includes(linha.probabilidade) ? linha.probabilidade : 'media',
          impacto: impactosValidos.includes(linha.impacto) ? linha.impacto : 'medio',
          mitigacao: linha.mitigacao || null,
          responsavel: linha.responsavel || null,
          status: statusValidos.includes(linha.status) ? linha.status : 'aberto'
        }
        const { data: existentes, error: erroBusca } = await supabase
          .from('riscos_projeto')
          .select('id')
          .eq('projeto_id', projetoId)
          .ilike('descricao', descricao)
          .limit(1)
        if (erroBusca) {
          resultado.erros.push('Linha ' + (i + 2) + ': ' + erroBusca.message)
          continue
        }
        const existente = existentes && existentes[0]
        if (existente) {
          const { error } = await supabase.from('riscos_projeto').update(dados).eq('id', existente.id)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ': ' + error.message)
          else resultado.atualizados++
        } else {
          const { error } = await supabase.from('riscos_projeto').insert(dados)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ': ' + error.message)
          else resultado.criados++
        }
      }
      return Response.json(resultado)
    }

    if (body.importar_roadmap) {
      const { data: roadmap, error: erroRoadmap } = await supabase
        .from('roadmaps')
        .select('riscos')
        .eq('id', body.roadmap_id)
        .single()
      if (erroRoadmap) return Response.json({ erro: erroRoadmap.message })
      const riscosRoadmap = roadmap?.riscos || []
      if (riscosRoadmap.length === 0) return Response.json({ riscos: [] })
      const entries = riscosRoadmap.map(r => ({
        projeto_id: body.projeto_id,
        descricao: r.descricao || 'Risco sem descricao',
        probabilidade: r.probabilidade || 'media',
        impacto: r.impacto || 'medio',
        mitigacao: r.mitigacao || null,
        status: 'aberto'
      }))
      const { data, error } = await supabase.from('riscos_projeto').insert(entries).select()
      if (error) return Response.json({ erro: error.message })
      return Response.json({ riscos: data })
    }
    const { data, error } = await supabase
      .from('riscos_projeto')
      .insert({
        projeto_id: body.projeto_id,
        descricao: body.descricao,
        categoria: body.categoria || null,
        probabilidade: body.probabilidade || 'media',
        impacto: body.impacto || 'medio',
        mitigacao: body.mitigacao || null,
        responsavel: body.responsavel || null,
        status: body.status || 'aberto'
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ risco: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['descricao', 'categoria', 'probabilidade', 'impacto', 'status', 'mitigacao', 'responsavel']
    const update = {}
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { error } = await supabase.from('riscos_projeto').update(update).eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('riscos_projeto').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
