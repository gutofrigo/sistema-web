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

    if (body.importar_csv && Array.isArray(body.projetos)) {
      const prioridadesValidas = ['baixa', 'media', 'alta']
      const statusValidos = ['pendente', 'em_andamento', 'concluido']
      const resultado = { criados: 0, atualizados: 0, erros: [] }

      for (const [i, linha] of body.projetos.entries()) {
        const titulo = (linha.titulo || '').trim()
        if (!titulo) {
          resultado.erros.push('Linha ' + (i + 2) + ': titulo em branco, ignorada')
          continue
        }
        const dados = {
          titulo,
          descricao: linha.descricao || null,
          responsavel: linha.responsavel || null,
          orcamento: linha.orcamento ? Number(linha.orcamento) : null,
          data_prevista_fim: linha.data_prevista_fim || null,
          prioridade: prioridadesValidas.includes(linha.prioridade) ? linha.prioridade : 'media',
          status: statusValidos.includes(linha.status) ? linha.status : 'pendente',
          area: linha.area || null,
          progresso: linha.progresso ? Math.max(0, Math.min(100, Number(linha.progresso) || 0)) : 0,
          em_risco: String(linha.em_risco).toLowerCase() === 'true' || String(linha.em_risco) === '1'
        }
        const { data: existentes, error: erroBusca } = await supabase
          .from('projetos')
          .select('id')
          .ilike('titulo', titulo)
          .limit(1)
        if (erroBusca) {
          resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + erroBusca.message)
          continue
        }
        const existente = existentes && existentes[0]
        if (existente) {
          const { error } = await supabase.from('projetos').update(dados).eq('id', existente.id)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + error.message)
          else resultado.atualizados++
        } else {
          const { error } = await supabase.from('projetos').insert(dados)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ' (' + titulo + '): ' + error.message)
          else resultado.criados++
        }
      }
      return Response.json(resultado)
    }

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
        orcamento: body.orcamento || null,
        data_prevista_fim: body.data_prevista_fim || null,
        prioridade: body.prioridade || 'media',
        status: 'pendente',
        area: body.area || null
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
export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['titulo', 'descricao', 'responsavel', 'orcamento', 'data_prevista_fim', 'prioridade', 'status', 'area', 'progresso', 'em_risco']
    const update = {}
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { data, error } = await supabase
      .from('projetos')
      .update(update)
      .eq('id', body.id)
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ projeto: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    await supabase.from('tarefas').delete().eq('projeto_id', body.id)
    const { error } = await supabase.from('projetos').delete().eq('id', body.id)
    if (error) throw new Error(error.message)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}