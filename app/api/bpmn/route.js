import Groq from 'groq-sdk'
export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const body = await req.json()
    const { descricao } = body
    const prompt = 'Voce e um consultor senior de gestao de processos (BPM), contratado para desenhar um diagrama detalhado e realista, aplicando ativamente frameworks e boas praticas de mercado reconhecidas — nao apenas descrevendo o que foi informado, mas enriquecendo o fluxo com o que um processo desse tipo deveria ter segundo o padrao da industria.\n\n' +
      'DESCRICAO DO PROCESSO:\n' + descricao + '\n\n' +
      'Antes de desenhar, identifique a categoria do processo e aplique o framework de mercado correspondente:\n' +
      '- Compras / Procurement / Pagamentos -> modelo P2P (Procure-to-Pay), com segregacao de funcoes (quem solicita, quem aprova e quem paga sao pessoas/areas diferentes) e aprovacao por alcada de valor\n' +
      '- RH / Contratacao / Onboarding -> funil padrao de recrutamento (triagem, entrevistas tecnicas e comportamentais, aprovacao do gestor, proposta, exame admissional, integracao)\n' +
      '- TI / Mudancas de sistema -> ITIL Change Management (abertura de RFC, avaliacao de risco e impacto, aprovacao em CAB, plano de rollback, implementacao, revisao pos-mudanca)\n' +
      '- Atendimento / Suporte / Chamados -> ITIL Incident e Service Request Management, com triagem, escalonamento por SLA e niveis de suporte (N1/N2/N3)\n' +
      '- Qualidade / Melhoria continua -> Lean Six Sigma (DMAIC) ou PDCA, com pontos de medicao e controle\n' +
      '- Financeiro / Contas a pagar-receber -> controles internos tipo COSO/SOX: dupla aprovacao, conciliacao, trilha de auditoria\n' +
      '- Projetos / Iniciativas -> ciclo de vida PMBOK/PMI (iniciacao, planejamento, execucao, monitoramento e controle, encerramento)\n' +
      'Se o processo nao se encaixar claramente em nenhuma categoria acima, aplique de forma geral os principios de gestao por processos (BPM CBOK): controles de qualidade, pontos de aprovacao, segregacao de funcoes e tratamento de excecoes.\n\n' +
      'Retorne APENAS um JSON com esta estrutura exata:\n' +
      '{\n' +
      '  "nome": "nome do processo",\n' +
      '  "metodologia": "framework(s) de mercado aplicado(s) e por que se encaixam neste processo, em 1-2 frases",\n' +
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
      '- Identifique TODOS os participantes/setores/sistemas envolvidos no processo, sem limitar a um numero fixo — inclua explicitamente papeis que o framework escolhido exige mesmo que nao tenham sido citados na descricao (ex: auditoria, compliance, CAB, aprovador de alcada), desde que façam sentido para o caso\n' +
      '- Gere entre 18 e 30 elementos — quebre o processo em passos realmente atomicos (cada verificacao, aprovacao, registro, notificacao, controle e handoff entre areas vira um elemento proprio, nao agrupe varias acoes em um so item generico)\n' +
      '- Use exatamente um elemento "inicio" e um ou mais elementos "fim" (um "fim" para cada desfecho distinto do processo, ex: aprovado, rejeitado, cancelado, escalado)\n' +
      '- Gateways representam toda decisao, verificacao condicional, alcada de aprovacao ou bifurcacao — inclua fluxos de excecao, rejeicao, re-trabalho, escalonamento e retorno para correcao, tipicos do framework aplicado, mesmo que nao tenham sido detalhados explicitamente na descricao\n' +
      '- Reflita segregacao de funcoes quando o framework exigir: a atividade de solicitar, aprovar e executar devem ficar em participantes diferentes sempre que isso for uma boa pratica reconhecida (ex: compras, financeiro)\n' +
      '- Nomes das atividades devem ser especificos e descritivos (ate 6 palavras) — evite nomes genericos como "Processar" ou "Verificar", prefira "Verificar limite de credito disponivel"\n' +
      '- Responda APENAS com o JSON, sem markdown, sem explicacoes'
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.3,
      max_tokens: 6500,
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
      const reparado = bruto
        .replace(/,(\s*[\]}])/g, '$1') // remove virgulas sobrando antes de ] ou }
        .replace(controleInvalido, ' ') // neutraliza caracteres de controle invalidos dentro de strings
      try {
        dados = JSON.parse(reparado)
      } catch (erroReparo) {
        throw new Error('A IA retornou um JSON invalido, tente gerar novamente. (' + erroParse.message + ')')
      }
    }
    return Response.json(dados)
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}
