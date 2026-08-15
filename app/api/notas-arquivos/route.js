import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const LIMITE_BYTES = 4 * 1024 * 1024 // 4MB

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const notaId = url.searchParams.get('nota_id')

    if (id) {
      const { data, error } = await supabase.from('notas_arquivos').select('*').eq('id', id).single()
      if (error) return Response.json({ erro: error.message })
      return Response.json({ arquivo: data })
    }

    const { data, error } = await supabase
      .from('notas_arquivos')
      .select('id, nota_id, nome, tipo, tamanho, criado_em')
      .eq('nota_id', notaId)
      .order('criado_em', { ascending: false })
    if (error) return Response.json({ erro: error.message })
    return Response.json({ arquivos: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.nota_id || !body.nome || !body.conteudo_base64) {
      return Response.json({ erro: 'nota_id, nome e conteudo_base64 sao obrigatorios' })
    }
    if (body.tamanho && body.tamanho > LIMITE_BYTES) {
      return Response.json({ erro: 'Arquivo maior que 4MB' })
    }
    const { data, error } = await supabase
      .from('notas_arquivos')
      .insert({
        nota_id: body.nota_id,
        nome: body.nome,
        tipo: body.tipo || null,
        tamanho: body.tamanho || null,
        conteudo_base64: body.conteudo_base64
      })
      .select('id, nota_id, nome, tipo, tamanho, criado_em')
    if (error) return Response.json({ erro: error.message })
    return Response.json({ arquivo: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('notas_arquivos').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
