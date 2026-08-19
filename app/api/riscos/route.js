import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const PESO_PROBABILIDADE = { baixa: 1, media: 2, alta: 3 }
const PESO_IMPACTO = { baixo: 1, medio: 2, alto: 3 }
function scoreRisco(r) {
  return (PESO_PROBABILIDADE[r.probabilidade] || 2) * (PESO_IMPACTO[r.impacto] || 2)
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const projetoId = url.searchParams.get('projeto_id')
    let query = supabase.from('riscos_projeto').select('*').order('criado_em', { ascending: false })
    if (projetoId) query = query.eq('projeto_id', projetoId)
    const { data, error } = await query
    if (error) return Response.json({ erro: error.message })
    return Response.json({ riscos: (data || []).map(r => ({ ...r, score: scoreRisco(r) })) })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function POST(req) {
  try {
    const body = await req.json()

    if (body.detectar_ia && body.projeto_id) {
      const [{ data: projeto }, { data: tarefas }, { data: lancamentos }, { data: riscosExistentes }] = await Promise.all([
        supabase.from('projetos').select('*').eq('id', body.projeto_id).single(),
        supabase.from('tarefas').select('titulo, responsavel, status, data_entrega').eq('projeto_id', body.projeto_id),
        supabase.from('lancamentos').select('valor, tipo, status').eq('projeto_id', body.projeto_id).eq('status', 'pago'),
        supabase.from('riscos_projeto').select('descricao').eq('projeto_id', body.projeto_id)
      ])
      if (!projeto) return Response.json({ erro: 'Projeto nao encontrado' })

      const hoje = new Date()
      const atrasadas = (tarefas || []).filter(t => t.data_entrega && t.status !== 'concluido' && new Date(t.data_entrega + 'T23:59:59') < hoje)
      const semResponsavel = (tarefas || []).filter(t => !t.responsavel && t.status !== 'concluido')
      const realizado = (lancamentos || []).filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const contexto = 'Voce e um consultor senior de gestao de riscos de projetos (PMBOK). Analise os dados abaixo e aponte riscos REAIS e ESPECIFICOS que ainda nao estao registrados — nao repita riscos genericos nem os ja listados.\n\n' +
        'PROJETO: ' + projeto.titulo + (projeto.descricao ? ' — ' + projeto.descricao : '') + '\n' +
        'Status: ' + projeto.status + ', Prazo previsto: ' + (projeto.data_prevista_fim || 'nao definido') + '\n' +
        'Orcamento: ' + (projeto.orcamento || 'nao definido') + ', Realizado ate agora: ' + realizado + '\n' +
        'Total de tarefas: ' + (tarefas || []).length + ', Atrasadas: ' + atrasadas.length + ', Sem responsavel definido: ' + semResponsavel.length + '\n' +
        (atrasadas.length > 0 ? 'Tarefas atrasadas: ' + atrasadas.map(t => t.titulo).slice(0, 8).join(', ') + '\n' : '') +
        (semResponsavel.length > 0 ? 'Tarefas sem responsavel: ' + semResponsavel.map(t => t.titulo).slice(0, 8).join(', ') + '\n' : '') +
        'Riscos ja registrados (NAO repita esses): ' + ((riscosExistentes || []).map(r => r.descricao).join('; ') || 'nenhum') + '\n\n' +
        'Retorne APENAS um JSON com esta estrutura exata, com no maximo 3 riscos plausiveis:\n' +
        '{ "riscos": [ { "descricao": "...", "categoria": "...", "probabilidade": "baixa|media|alta", "impacto": "baixo|medio|alto", "mitigacao": "..." } ] }\n' +
        'Se nao houver sinais suficientes para apontar riscos com confianca, retorne { "riscos": [] }. Responda APENAS com o JSON, sem markdown.'

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: contexto }],
        model: 'openai/gpt-oss-20b',
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      })
      const texto = completion.choices[0].message.content
      const inicio = texto.indexOf('{')
      const fim = texto.lastIndexOf('}')
      if (inicio === -1 || fim === -1) throw new Error('JSON nao encontrado na resposta da IA')
      const bruto = texto.substring(inicio, fim + 1)
      let dados
      try {
        dados = JSON.parse(bruto)
      } catch (erroParse) {
        const controleInvalido = new RegExp('[\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F]', 'g')
        const reparado = bruto.replace(/,(\s*[\]}])/g, '$1').replace(controleInvalido, ' ')
        try {
          dados = JSON.parse(reparado)
        } catch (erroReparo) {
          throw new Error('A IA retornou um JSON invalido, tente novamente. (' + erroParse.message + ')')
        }
      }
      return Response.json({ sugestoes: Array.isArray(dados.riscos) ? dados.riscos : [] })
    }

    if (body.importar_csv && Array.isArray(body.riscos)) {
      const probabilidadesValidas = ['baixa', 'media', 'alta']
      const impactosValidos = ['baixo', 'medio', 'alto']
      const statusValidos = ['aberto', 'mitigado', 'fechado']
      const resultado = { criados: 0, atualizados: 0, erros: [] }

      const { data: projetos, error: erroProjetos } = await supabase.from('projetos').select('id, titulo')
      if (erroProjetos) return Response.json({ erro: erroProjetos.message })
      const projetoPorTitulo = new Map((projetos || []).map(p => [p.titulo.trim().toLowerCase(), p.id]))

      for (const [i, linha] of body.riscos.entries()) {
        const descricao = (linha.descricao || '').trim()
        const nomeProjeto = (linha.projeto || '').trim()
        if (!descricao || !nomeProjeto) {
          resultado.erros.push('Linha ' + (i + 2) + ': projeto e descricao sao obrigatorios')
          continue
        }
        const projetoId = projetoPorTitulo.get(nomeProjeto.toLowerCase())
        if (!projetoId) {
          resultado.erros.push('Linha ' + (i + 2) + ': projeto "' + nomeProjeto + '" nao encontrado')
          continue
        }
        const dados = {
          projeto_id: projetoId,
          descricao,
          categoria: linha.categoria || null,
          probabilidade: probabilidadesValidas.includes(linha.probabilidade) ? linha.probabilidade : 'media',
          impacto: impactosValidos.includes(linha.impacto) ? linha.impacto : 'medio',
          mitigacao: linha.mitigacao || null,
          responsavel: linha.responsavel || null,
          status: statusValidos.includes(linha.status) ? linha.status : 'aberto'
        }
        const { data: existentes, error: erroBusca } = await supabase
          .from('riscos_projeto')
          .select('id')
          .eq('projeto_id', projetoId)
          .ilike('descricao', descricao)
          .limit(1)
        if (erroBusca) {
          resultado.erros.push('Linha ' + (i + 2) + ': ' + erroBusca.message)
          continue
        }
        const existente = existentes && existentes[0]
        if (existente) {
          const { error } = await supabase.from('riscos_projeto').update(dados).eq('id', existente.id)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ': ' + error.message)
          else resultado.atualizados++
        } else {
          const { error } = await supabase.from('riscos_projeto').insert(dados)
          if (error) resultado.erros.push('Linha ' + (i + 2) + ': ' + error.message)
          else resultado.criados++
        }
      }
      return Response.json(resultado)
    }

    if (body.importar_roadmap) {
      const { data: roadmap, error: erroRoadmap } = await supabase
        .from('roadmaps')
        .select('riscos')
        .eq('id', body.roadmap_id)
        .single()
      if (erroRoadmap) return Response.json({ erro: erroRoadmap.message })
      const riscosRoadmap = roadmap?.riscos || []
      if (riscosRoadmap.length === 0) return Response.json({ riscos: [] })
      const entries = riscosRoadmap.map(r => ({
        projeto_id: body.projeto_id,
        descricao: r.descricao || 'Risco sem descricao',
        probabilidade: r.probabilidade || 'media',
        impacto: r.impacto || 'medio',
        mitigacao: r.mitigacao || null,
        status: 'aberto'
      }))
      const { data, error } = await supabase.from('riscos_projeto').insert(entries).select()
      if (error) return Response.json({ erro: error.message })
      return Response.json({ riscos: data })
    }
    const { data, error } = await supabase
      .from('riscos_projeto')
      .insert({
        projeto_id: body.projeto_id,
        descricao: body.descricao,
        categoria: body.categoria || null,
        probabilidade: body.probabilidade || 'media',
        impacto: body.impacto || 'medio',
        mitigacao: body.mitigacao || null,
        responsavel: body.responsavel || null,
        status: body.status || 'aberto'
      })
      .select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ risco: data[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function PATCH(req) {
  try {
    const body = await req.json()
    if (!body.id) return Response.json({ erro: 'id obrigatorio' })
    const campos = ['descricao', 'categoria', 'probabilidade', 'impacto', 'status', 'mitigacao', 'responsavel']
    const update = {}
    for (const campo of campos) {
      if (body[campo] !== undefined) update[campo] = body[campo]
    }
    const { error } = await supabase.from('riscos_projeto').update(update).eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('riscos_projeto').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
