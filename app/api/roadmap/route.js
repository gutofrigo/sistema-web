import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function GET(req) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (id) {
      const { data } = await supabase.from('roadmaps').select('*').eq('id', id).single()
      if (!data) return Response.json({ erro: 'Roadmap nao encontrado' })
      return Response.json(data)
    }
    const { data } = await supabase.from('roadmaps').select('id, titulo, area, porte, criado_em').order('criado_em', { ascending: false })
    return Response.json(data || [])
  } catch (e) {
    return Response.json([])
  }
}
export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const body = await req.json()
    const { titulo, descricao, responsavel, porte, area } = body
    const prompt = 'Voce e um especialista em gestao de projetos e inovacao. Analise a ideia abaixo e gere um roadmap completo e detalhado.\n\n' +
      'IDEIA: ' + titulo + '\n' +
      'DESCRICAO: ' + (descricao || 'Nao informada') + '\n' +
      'AREA: ' + (area || 'Nao informada') + '\n' +
      'PORTE: ' + (porte || 'medio') + '\n\n' +
      'Gere um JSON com EXATAMENTE esta estrutura (sem texto fora do JSON):\n' +
      '{\n' +
      '  "resumo": "resumo executivo do projeto em 2-3 frases",\n' +
      '  "oportunidades": ["oportunidade 1 identificada pela IA", "oportunidade 2", "oportunidade 3"],\n' +
      '  "fases": [\n' +
      '    {\n' +
      '      "numero": 1,\n' +
      '      "nome": "Nome da Fase",\n' +
      '      "duracao": "X a Y semanas",\n' +
      '      "cor": "blue",\n' +
      '      "objetivo": "objetivo principal desta fase",\n' +
      '      "acoes": ["acao 1", "acao 2", "acao 3"],\n' +
      '      "tecnologias": ["tecnologia 1", "tecnologia 2"],\n' +
      '      "resultado_esperado": "o que deve estar pronto ao final desta fase"\n' +
      '    }\n' +
      '  ],\n' +
      '  "ideias_extras": ["ideia de evolucao 1", "ideia 2", "ideia 3"],\n' +
      '  "estrutura_resumida": "Ideia -> Fase1 -> Fase2 -> Fase3 -> Escala",\n' +
      '  "por_que_bom": ["motivo 1", "motivo 2", "motivo 3"],\n' +
      '  "riscos": [\n' +
      '    {\n' +
      '      "descricao": "descricao do risco",\n' +
      '      "probabilidade": "alta",\n' +
      '      "impacto": "alto",\n' +
      '      "mitigacao": "como mitigar"\n' +
      '    }\n' +
      '  ],\n' +
      '  "kpis": ["KPI 1", "KPI 2", "KPI 3"],\n' +
      '  "stakeholders": ["stakeholder 1", "stakeholder 2"]\n' +
      '}\n\n' +
      'Regras:\n' +
      '- Use a cor "blue" para fase 1, "yellow" para fase 2, "orange" para fase 3, "red" para fase 4, "purple" para fase 5+\n' +
      '- Gere entre 4 e 6 fases dependendo da complexidade\n' +
      '- Identifique oportunidades reais de mercado ou tecnicas que a IA detecta na ideia\n' +
      '- Seja especifico e pratico nas acoes\n' +
      '- Sugira tecnologias apenas quando relevante para a fase\n' +
      '- Use metodologia PMI/PMBOK nas fases\n' +
      '- Responda APENAS com o JSON, sem markdown, sem explicacoes'
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 3000
    })
    const texto = completion.choices[0].message.content
    const inicio = texto.indexOf('{')
    const fim = texto.lastIndexOf('}')
    if (inicio === -1 || fim === -1) throw new Error('JSON nao encontrado na resposta')
    const jsonStr = texto.substring(inicio, fim + 1)
    const dados = JSON.parse(jsonStr)
    const { data, error } = await supabase.from('roadmaps').insert([{
      titulo,
      descricao,
      responsavel,
      porte,
      area,
      resumo: dados.resumo || '',
      oportunidades: dados.oportunidades || [],
      fases: dados.fases || [],
      ideias_extras: dados.ideias_extras || [],
      estrutura_resumida: dados.estrutura_resumida || '',
      por_que_bom: dados.por_que_bom || [],
      riscos: dados.riscos || [],
      kpis: dados.kpis || [],
      stakeholders: dados.stakeholders || [],
      pontos_atencao: dados.pontos_atencao || []
    }]).select()
    if (error) throw new Error(error.message)
    return Response.json({ roadmap: data[0], dados })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('roadmaps').delete().eq('id', body.id)
    if (error) throw new Error(error.message)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}