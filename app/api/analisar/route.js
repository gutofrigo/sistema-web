import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vaqxsqckkfsboppfcmsg.supabase.co',
  'sb_publishable_sYiXHAT5Oa_K8Cwg3GThqw_ONq856_j'
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
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await resposta.json()

    let relatorio = ''
    if (data.choices && data.choices[0]) {
      relatorio = data.choices[0].message.content
    } else {
      relatorio = 'Erro na IA: ' + JSON.stringify(data)
    }

    await supabase.from('entrevistas').insert({
      processo: processo,
      responsavel: nome,
      respostas: respostas,
      relatorio: relatorio
    })

    return Response.json({ relatorio: relatorio })

  } catch (e) {
    return Response.json({ relatorio: 'Erro: ' + e.message })
  }
}