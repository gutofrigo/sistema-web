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
      .from('tarefas')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('criado_em', { ascending: true })
    if (error) return Response.json({ erro: error.message })
    return Response.json({ tarefas: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function POST(req) {
  try {
    const body = await req.json()
    if (body.id && body.status) {
      const { error } = await supabase
        .from('tarefas')
        .update({ status: body.status, concluido_em: body.status === 'concluido' ? new Date().toISOString() : null })
        .eq('id', body.id)
      if (error) return Response.json({ erro: error.message })
      return Response.json({ ok: true })
    }
    const { data, error } = await supabase
      .from('tarefas')
      .insert({
        projeto_id: body.projeto_id,
        tarefa_pai_id: body.tarefa_pai_id || null,
        titulo: body.titulo,
        responsavel: body.responsavel || null,
        data_inicio: body.data_inicio || null,
        data_entrega: body.data_entrega || null,
        status: body.status || 'pendente',
        concluido_em: body.status === 'concluido' ? new Date().toISOString() : null
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ tarefa: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    await supabase.from('tarefas').delete().eq('tarefa_pai_id', body.id)
    const { error } = await supabase.from('tarefas').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}