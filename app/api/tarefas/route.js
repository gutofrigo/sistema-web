import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
export async function GET(req) {
  try {
    const url = new URL(req.url)
    const projetoId = url.searchParams.get('projeto_id')
    let query = supabase.from('tarefas').select('*').order('criado_em', { ascending: true })
    if (projetoId) query = query.eq('projeto_id', projetoId)
    const { data, error } = await query
    if (error) return Response.json({ erro: error.message })
    return Response.json({ tarefas: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function POST(req) {
  try {
    const body = await req.json()

    if (body.importar_csv && Array.isArray(body.tarefas)) {
      const statusValidos = ['pendente', 'em_andamento', 'concluido']
      const resultado = { criados: 0, atualizados: 0, erros: [] }

      const { data: projetos, error: erroProjetos } = await supabase.from('projetos').select('id, titulo')
      if (erroProjetos) return Response.json({ erro: erroProjetos.message })
      const projetoPorTitulo = new Map((projetos || []).map(p => [p.titulo.trim().toLowerCase(), p.id]))

      for (const [i, linha] of body.tarefas.entries()) {
        const titulo = (linha.titulo || '').trim()
        const nomeProjeto = (linha.projeto || '').trim()
        if (!titulo || !nomeProjeto) {
          resultado.erros.push('Linha ' + (i + 2) + ': projeto e titulo sao obrigatorios')
          continue
        }
        const projetoId = projetoPorTitulo.get(nomeProjeto.toLowerCase())
        if (!projetoId) {
          resultado.erros.push('Linha ' + (i + 2) + ': projeto "' + nomeProjeto + '" nao encontrado')
          continue
        }
        const status = statusValidos.includes(linha.status) ? linha.status : 'pendente'
        const dados = {
          projeto_id: projetoId,
          titulo,
          responsavel: linha.responsavel || null,
          status,
          progresso: linha.progresso ? Math.max(0, Math.min(100, Number(linha.progresso) || 0)) : 0,
          data_inicio: linha.data_inicio || null,
          data_entrega: linha.data_entrega || null,
          concluido_em: status === 'concluido' ? new Date().toISOString() : null
        }
        const { data: existentes, error: erroBusca } = await supabase
          .from('tarefas')
          .select('id')
          .eq('projeto_id', projetoId)
          .ilike('titulo', titulo)
          .is('tarefa_pai_id', null)
          .limit(1)
        if (erroBusca) {
          resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + erroBusca.message)
          continue
        }
        const existente = existentes && existentes[0]
        if (existente) {
          const { error } = await supabase.from('tarefas').update(dados).eq('id', existente.id)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + error.message)
          else resultado.atualizados++
        } else {
          const { error } = await supabase.from('tarefas').insert(dados)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + error.message)
          else resultado.criados++
        }
      }
      return Response.json(resultado)
    }

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
        progresso: body.progresso || 0,
        concluido_em: body.status === 'concluido' ? new Date().toISOString() : null
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ tarefa: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['titulo', 'responsavel', 'progresso', 'data_inicio', 'data_entrega', 'status']
    const update = {}
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { data, error } = await supabase
      .from('tarefas')
      .update(update)
      .eq('id', body.id)
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
