import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function GET(req, { params }) {
  const id = await params.id
  const { data } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', id)
    .single()
  if (!data) return Response.json({ erro: 'Roadmap nao encontrado', id_recebido: id })
  return Response.json(data)
}