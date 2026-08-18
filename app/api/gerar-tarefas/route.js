import Groq from 'groq-sdk'
export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const body = await req.json()
    const { objetivo, projeto } = body
    const prompt = 'Voce e um especialista em gestao de projetos. Gere uma lista de tarefas para o seguinte objetivo:\n\n' +
      'PROJETO: ' + (projeto || 'Nao informado') + '\n' +
      'OBJETIVO: ' + objetivo + '\n\n' +
      'Retorne APENAS um JSON com esta estrutura:\n' +
      '{\n' +
      '  "tarefas": [\n' +
      '    {\n' +
      '      "titulo": "nome da tarefa",\n' +
      '      "responsavel": "area ou pessoa sugerida",\n' +
      '      "prazo_dias": 5,\n' +
      '      "prioridade": "alta"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'Regras:\n' +
      '- Gere entre 4 e 8 tarefas praticas e especificas\n' +
      '- prioridade deve ser "alta", "media" ou "baixa"\n' +
      '- prazo_dias e um numero inteiro de dias para concluir\n' +
      '- Ordene da mais urgente para a menos urgente\n' +
      '- Responda APENAS com o JSON, sem texto adicional'
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      max_tokens: 1500
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