import Groq from 'groq-sdk'
export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const body = await req.json()
    const { descricao } = body
    const prompt = 'Voce e um especialista em modelagem de processos BPMN. Analise a descricao abaixo e gere um modelo de processo estruturado.\n\n' +
      'DESCRICAO DO PROCESSO:\n' + descricao + '\n\n' +
      'Retorne APENAS um JSON com esta estrutura exata:\n' +
      '{\n' +
      '  "nome": "nome do processo",\n' +
      '  "participantes": ["Participante1", "Participante2", "Participante3"],\n' +
      '  "elementos": [\n' +
      '    { "id": "e1", "tipo": "inicio", "nome": "Inicio", "participante": "Participante1" },\n' +
      '    { "id": "a1", "tipo": "atividade", "nome": "Nome da Atividade", "participante": "Participante1" },\n' +
      '    { "id": "g1", "tipo": "gateway", "nome": "Condicao?", "participante": "Participante1" },\n' +
      '    { "id": "a2", "tipo": "atividade", "nome": "Atividade Sim", "participante": "Participante2" },\n' +
      '    { "id": "a3", "tipo": "atividade", "nome": "Atividade Nao", "participante": "Participante1" },\n' +
      '    { "id": "e2", "tipo": "fim", "nome": "Fim", "participante": "Participante2" }\n' +
      '  ],\n' +
      '  "conexoes": [\n' +
      '    { "de": "e1", "para": "a1", "label": "" },\n' +
      '    { "de": "a1", "para": "g1", "label": "" },\n' +
      '    { "de": "g1", "para": "a2", "label": "Sim" },\n' +
      '    { "de": "g1", "para": "a3", "label": "Nao" },\n' +
      '    { "de": "a2", "para": "e2", "label": "" },\n' +
      '    { "de": "a3", "para": "e2", "label": "" }\n' +
      '  ]\n' +
      '}\n\n' +
      'Regras importantes:\n' +
      '- Identifique todos os participantes/setores envolvidos no processo\n' +
      '- Gere entre 6 e 12 elementos\n' +
      '- Use exatamente um elemento "inicio" e um ou dois elementos "fim"\n' +
      '- Gateways representam decisoes ou bifurcacoes no processo\n' +
      '- Mantenha os nomes curtos (max 4 palavras)\n' +
      '- Responda APENAS com o JSON, sem markdown, sem explicacoes'
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.3,
      max_tokens: 2000
    })
    const texto = completion.choices[0].message.content
    const inicio = texto.indexOf('{')
    const fim = texto.lastIndexOf('}')
    if (inicio === -1 || fim === -1) throw new Error('JSON nao encontrado')
    const dados = JSON.parse(texto.substring(inicio, fim + 1))
    return Response.json(dados)
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}