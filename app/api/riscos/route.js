import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
export async function GET(req) {
  try {
    const url = new URL(req.url)
    const projetoId = url.searchParams.get('projeto_id')
    const { data, error } = await supabase
      .from('riscos_projeto')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('criado_em', { ascending: false })
    if (error) return Response.json({ erro: error.message })
    return Response.json({ riscos: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function POST(req) {
  try {
    const body = await req.json()
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
