import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      return Response.json({ erro: error.message })
    }

    return Response.json({ projetos: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const id = body.id
    const status = body.status

    if (id && status) {
      const { error } = await supabase
        .from('projetos')
        .update({ status: status })
        .eq('id', id)

      if (error) {
        return Response.json({ erro: error.message })
      }

      return Response.json({ ok: true })
    }

    const { data, error } = await supabase
      .from('projetos')
      .insert({
        titulo: body.titulo,
        descricao: body.descricao,
        responsavel: body.responsavel,
        entrevista_id: body.entrevista_id,
        status: 'pendente'
      })
      .select()

    if (error) {
      return Response.json({ erro: error.message })
    }

    return Response.json({ projeto: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}