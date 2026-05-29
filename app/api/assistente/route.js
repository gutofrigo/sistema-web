import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const body = await req.json()
    const { pergunta, historico } = body
    const { data: projetos } = await supabase.from('projetos').select('*').order('criado_em', { ascending: false })
    const { data: tarefas } = await supabase.from('tarefas').select('*').order('criado_em', { ascending: false })
    const { data: roadmaps } = await supabase.from('roadmaps').select('id, titulo, area, porte, criado_em').order('criado_em', { ascending: false })
    const hoje = new Date().toISOString().split('T')[0]
    const contexto = 'Voce e um assistente inteligente de gestao de projetos. Responda de forma clara, objetiva e em portugues.\n\n' +
      'DATA DE HOJE: ' + hoje + '\n\n' +
      'PROJETOS (' + (projetos ? projetos.length : 0) + ' total):\n' +
      JSON.stringify(projetos || []) + '\n\n' +
      'TAREFAS (' + (tarefas ? tarefas.length : 0) + ' total):\n' +
      JSON.stringify(tarefas || []) + '\n\n' +
      'ROADMAPS (' + (roadmaps ? roadmaps.length : 0) + ' total):\n' +
      JSON.stringify(roadmaps || []) + '\n\n' +
      'Use esses dados para responder as perguntas do usuario. Seja direto e pratico. Quando listar itens, use no maximo 5. Nao invente dados que nao existem.'
    const msgs = [{ role: 'system', content: contexto }]
    if (historico && historico.length > 0) {
      for (const h of historico.slice(-6)) {
        msgs.push({ role: h.tipo === 'usuario' ? 'user' : 'assistant', content: h.texto })
      }
    }
    msgs.push({ role: 'user', content: pergunta })
    const completion = await groq.chat.completions.create({
      messages: msgs,
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 1000
    })
    return Response.json({ resposta: completion.choices[0].message.content })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}