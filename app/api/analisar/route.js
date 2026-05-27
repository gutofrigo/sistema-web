import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const processo = body.processo
    const nome = body.nome
    const respostas = body.respostas

    let texto = respostas.map(r => 'P: ' + r.pergunta + ' R: ' + r.resposta).join(' ')
    const prompt = 'Analise o processo ' + processo + ' e gere: 1) Problemas encontrados 2) 3 Sugestoes de melhoria 3) Proximos passos. ' + texto

    const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await resposta.json()
    let relatorio = data.choices && data.choices[0] ? data.choices[0].message.content : 'Erro: ' + JSON.stringify(data)

    await supabase.from('entrevistas').insert({
      processo, responsavel: nome, respostas, relatorio
    })

    return Response.json({ relatorio })
  } catch (e) {
    return Response.json({ relatorio: 'Erro: ' + e.message })
  }
}