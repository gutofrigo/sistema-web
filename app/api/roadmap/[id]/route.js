import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function GET(req, { params }) {
  const { data } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', params.id)
    .single()
  if (!data) return Response.json({ erro: 'Roadmap nao encontrado' }, { status: 404 })
  return Response.json(data)
}
