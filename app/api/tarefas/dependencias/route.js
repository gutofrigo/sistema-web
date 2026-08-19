import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
export async function GET(req) {
  try {
    const url = new URL(req.url)
    const tarefaId = url.searchParams.get('tarefa_id')
    const projetoId = url.searchParams.get('projeto_id')
    if (tarefaId) {
      const { data, error } = await supabase.from('tarefa_dependencias').select('*').eq('tarefa_id', tarefaId)
      if (error) return Response.json({ erro: error.message })
      return Response.json({ dependencias: data })
    }
    if (projetoId) {
      const { data: tarefasProjeto, error: erroTarefas } = await supabase.from('tarefas').select('id').eq('projeto_id', projetoId)
      if (erroTarefas) return Response.json({ erro: erroTarefas.message })
      const ids = (tarefasProjeto || []).map(t => t.id)
      if (ids.length === 0) return Response.json({ dependencias: [] })
      const { data, error } = await supabase.from('tarefa_dependencias').select('*').in('tarefa_id', ids)
      if (error) return Response.json({ erro: error.message })
      return Response.json({ dependencias: data })
    }
    const { data, error } = await supabase.from('tarefa_dependencias').select('*')
    if (error) return Response.json({ erro: error.message })
    return Response.json({ dependencias: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.tarefa_id || !body.predecessor_id) return Response.json({ erro: 'tarefa_id e predecessor_id sao obrigatorios' })
    const { data, error } = await supabase
      .from('tarefa_dependencias')
      .insert({ tarefa_id: body.tarefa_id, predecessor_id: body.predecessor_id })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ dependencia: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase
      .from('tarefa_dependencias')
      .delete()
      .eq('tarefa_id', body.tarefa_id)
      .eq('predecessor_id', body.predecessor_id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
