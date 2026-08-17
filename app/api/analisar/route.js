import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

function extrairProjetos(relatorio, responsavel) {
  const projetos = []
  const linhas = relatorio.split('\n')
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim()
    
    if (linha.match(/sugest[aã]o\s*\d|melhoria\s*\d|\d[\.\)]\s*[A-Z]/i)) {
      const titulo = linha.replace(/^\d[\.\)]\s*/, '').substring(0, 80)
      if (titulo.length > 10) {
        projetos.push({
          titulo: titulo,
          descricao: linha,
          responsavel: responsavel,
          status: 'pendente'
        })
      }
    }
  }

  if (projetos.length === 0) {
    projetos.push({
      titulo: 'Melhoria de processo - revisar relatorio',
      descricao: relatorio.substring(0, 200),
      responsavel: responsavel,
      status: 'pendente'
    })
  }

  return projetos.slice(0, 3)
}

export async function POST(req) {
  try {
    const body = await req.json()
    const processo = body.processo
    const nome = body.nome
    const respostas = body.respostas

    let texto = respostas.map(r => 'P: ' + r.pergunta + ' R: ' + r.resposta).join(' ')
    const prompt = 'Voce e um Gerente de Projetos e Produto senior, atuando como consultor externo contratado para fazer um diagnostico critico do processo "' + processo + '". ' +
      'Analise com o mais alto padrao de criticidade de mercado: nao seja condescendente, nao elogie sem necessidade, e aponte falhas e riscos reais mesmo que a pessoa entrevistada nao tenha percebido ou perguntado sobre eles diretamente. ' +
      'Baseie toda a analise em boas praticas reconhecidas de mercado (PMBOK/PMI, metodologias ageis, Lean, Six Sigma, gestao de produto) e cite a pratica relevante ao fazer cada recomendacao. ' +
      'Alem de responder com base nas respostas da entrevista abaixo, identifique proativamente riscos, gargalos, gaps de governanca ou falta de indicadores que sao tipicos nesse tipo de processo, mesmo que nao tenham sido mencionados explicitamente nas respostas. ' +
      'Gere exatamente esta estrutura: ' +
      '1) Diagnostico critico (problemas e riscos reais identificados, incluindo os que voce percebeu alem do que foi perguntado) ' +
      '2) 3 Sugestoes de melhoria priorizadas, numeradas como "1." "2." "3.", cada uma indicando o nivel de criticidade (Alta/Media/Baixa) e a pratica de mercado em que se baseia ' +
      '3) Proximos passos objetivos e acionaveis, com responsavel sugerido e prazo estimado. ' +
      'Seja direto, especifico e critico - evite generalidades vagas ou respostas mornas. Dados da entrevista: ' + texto

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

    let relatorio = ''
    if (data.choices && data.choices[0]) {
      relatorio = data.choices[0].message.content
    } else {
      relatorio = 'Erro na IA: ' + JSON.stringify(data)
    }

    const { data: entrevistaSalva } = await supabase
      .from('entrevistas')
      .insert({
        processo: processo,
        responsavel: nome,
        respostas: respostas,
        relatorio: relatorio
      })
      .select()

    const entrevistaId = entrevistaSalva && entrevistaSalva[0] ? entrevistaSalva[0].id : null

    const projetos = extrairProjetos(relatorio, nome)
    
    for (let i = 0; i < projetos.length; i++) {
      await supabase.from('projetos').insert({
        titulo: projetos[i].titulo,
        descricao: projetos[i].descricao,
        responsavel: projetos[i].responsavel,
        entrevista_id: entrevistaId,
        status: 'pendente'
      })
    }

    return Response.json({ relatorio: relatorio, projetos_criados: projetos.length })

  } catch (e) {
    return Response.json({ relatorio: 'Erro: ' + e.message })
  }
}