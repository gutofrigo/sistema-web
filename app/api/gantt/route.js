import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function GET() {
  try {
    const { data: projetos } = await supabase
      .from('projetos')
      .select('*')
      .order('criado_em', { ascending: true })
    const { data: tarefas } = await supabase
      .from('tarefas')
      .select('*')
      .order('data_inicio', { ascending: true })
    return Response.json({ projetos: projetos || [], tarefas: tarefas || [] })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}