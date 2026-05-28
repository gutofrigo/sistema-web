import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) return Response.json({ erro: error.message })
    return Response.json({ roadmaps: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const titulo = body.titulo
    const descricao = body.descricao
    const responsavel = body.responsavel
    const porte = body.porte
    const area = body.area

    const prompt = 'Voce e um especialista em gerenciamento de projetos com certificacao PMP e vasta experiencia em PMI/PMBOK. Gere um roadmap detalhado para o seguinte projeto: Titulo: ' + titulo + '. Descricao: ' + descricao + '. Porte: ' + porte + '. Area: ' + area + '. Retorne APENAS um JSON valido sem nenhum texto antes ou depois, com esta estrutura exata: {"resumo": "texto do resumo executivo com duracao estimada e impacto esperado", "fases": [{"nome": "1. Iniciacao", "periodo": "Semana 1-2", "atividades": [{"titulo": "titulo da atividade", "responsavel": "responsavel sugerido", "duracao": "X dias"}]}], "riscos": [{"titulo": "titulo do risco", "probabilidade": "Alta|Media|Baixa", "impacto": "Alto|Medio|Baixo", "mitigacao": "plano de mitigacao"}], "pontos_atencao": ["ponto 1", "ponto 2"], "kpis": [{"indicador": "nome do kpi", "meta": "valor da meta"}], "stakeholders": [{"nome": "nome ou cargo", "papel": "papel no projeto"}]}. Gere 5 fases (Iniciacao, Planejamento, Execucao, Monitoramento, Encerramento), pelo menos 4 atividades por fase, pelo menos 4 riscos, pelo menos 4 pontos de atencao, pelo menos 4 kpis e pelo menos 4 stakeholders.'

    const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    })

    const data = await resposta.json()

    let conteudo = ''
    if (data.choices && data.choices[0]) {
      conteudo = data.choices[0].message.content
    } else {
      return Response.json({ erro: 'Erro na IA: ' + JSON.stringify(data) })
    }

    let roadmapData = {}
    try {
      const inicio = conteudo.indexOf('{')
      const fim = conteudo.lastIndexOf('}')
      const jsonLimpo = conteudo.substring(inicio, fim + 1)
      roadmapData = JSON.parse(jsonLimpo)
    } catch (e) {
      return Response.json({ erro: 'Erro ao processar resposta da IA. Tente novamente.' })
    }

    const { data: salvo, error } = await supabase
      .from('roadmaps')
      .insert({
        titulo: titulo,
        descricao: descricao,
        responsavel: responsavel,
        porte: porte,
        area: area,
        resumo: roadmapData.resumo || '',
        fases: roadmapData.fases || [],
        riscos: roadmapData.riscos || [],
        pontos_atencao: roadmapData.pontos_atencao || [],
        kpis: roadmapData.kpis || [],
        stakeholders: roadmapData.stakeholders || []
      })
      .select()

    if (error) return Response.json({ erro: error.message })

    return Response.json({ roadmap: salvo[0] })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}