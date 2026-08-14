import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

function prioridadeParaTexto(n) {
  if (n >= 8) return 'alta'
  if (n >= 4) return 'media'
  return 'baixa'
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('iniciativas')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) return Response.json({ erro: error.message })
    return Response.json({ iniciativas: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()

    if (body.promover && body.id) {
      const { data: iniciativa, error: erroBusca } = await supabase
        .from('iniciativas')
        .select('*')
        .eq('id', body.id)
        .single()
      if (erroBusca) return Response.json({ erro: erroBusca.message })

      const { data: projetoNovo, error: erroProjeto } = await supabase
        .from('projetos')
        .insert({
          titulo: iniciativa.titulo,
          descricao: iniciativa.descricao,
          responsavel: iniciativa.responsavel || iniciativa.solicitante,
          prioridade: prioridadeParaTexto(iniciativa.prioridade),
          status: 'pendente'
        })
        .select()
      if (erroProjeto) return Response.json({ erro: erroProjeto.message })

      const { error: erroUpdate } = await supabase
        .from('iniciativas')
        .update({ projeto_id: projetoNovo[0].id, status: 'concluido' })
        .eq('id', body.id)
      if (erroUpdate) return Response.json({ erro: erroUpdate.message })

      return Response.json({ projeto: projetoNovo[0] })
    }

    const { data, error } = await supabase
      .from('iniciativas')
      .insert({
        titulo: body.titulo,
        descricao: body.descricao || null,
        categoria: body.categoria || 'outros',
        prioridade: body.prioridade || 5,
        solicitante: body.solicitante || null,
        responsavel: body.responsavel || null,
        status: body.status || 'backlog'
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ iniciativa: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['titulo', 'descricao', 'categoria', 'prioridade', 'solicitante', 'responsavel', 'status']
    const update = {}
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { data, error } = await supabase
      .from('iniciativas')
      .update(update)
      .eq('id', body.id)
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ iniciativa: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('iniciativas').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
