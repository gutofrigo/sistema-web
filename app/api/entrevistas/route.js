import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function GET() {
  const { data } = await supabase.from('entrevistas').select('*').order('criado_em', { ascending: false })
  return Response.json(data || [])
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('entrevistas').delete().eq('id', body.id).select()
    if (error) throw new Error(error.message)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}