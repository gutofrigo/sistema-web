import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (id) {
      const { data, error } = await supabase.from('notas').select('*').eq('id', id).single()
      if (error) return Response.json({ erro: error.message })
      return Response.json({ nota: data })
    }

    const { data, error } = await supabase
      .from('notas')
      .select('id, titulo, projeto_id, criado_em, atualizado_em')
      .order('atualizado_em', { ascending: false })
    if (error) return Response.json({ erro: error.message })
    return Response.json({ notas: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.titulo) return Response.json({ erro: 'titulo obrigatorio' })
    const { data, error } = await supabase
      .from('notas')
      .insert({
        titulo: body.titulo,
        conteudo: body.conteudo || '',
        projeto_id: body.projeto_id || null
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ nota: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['titulo', 'conteudo', 'projeto_id']
    const update = { atualizado_em: new Date().toISOString() }
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { data, error } = await supabase
      .from('notas')
      .update(update)
      .eq('id', body.id)
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ nota: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('notas').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
