import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function GET() {
  try {
    const { data: projetos } = await supabase
      .from('projetos')
      .select('*')
      .order('criado_em', { ascending: false })

    const { data: tarefas } = await supabase
      .from('tarefas')
      .select('*')
      .order('data_entrega', { ascending: true })

    const { data: entrevistas } = await supabase
      .from('entrevistas')
      .select('id, processo, responsavel, criado_em')
      .order('criado_em', { ascending: false })
      .limit(3)

    const totalProjetos = projetos ? projetos.length : 0
    const pendentes = tarefas ? tarefas.filter(t => t.status === 'pendente').length : 0
    const emAndamento = tarefas ? tarefas.filter(t => t.status === 'em_andamento').length : 0
    const concluidas = tarefas ? tarefas.filter(t => t.status === 'concluido').length : 0

    const hoje = new Date()
    const em7dias = new Date()
    em7dias.setDate(hoje.getDate() + 7)

    const tarefasProximas = tarefas ? tarefas.filter(t => {
      if (!t.data_entrega) return false
      if (t.status === 'concluido') return false
      const entrega = new Date(t.data_entrega)
      return entrega <= em7dias
    }).slice(0, 5) : []

    return Response.json({
      contadores: {
        totalProjetos,
        pendentes,
        emAndamento,
        concluidas
      },
      projetosRecentes: projetos ? projetos.slice(0, 3) : [],
      tarefasProximas,
      entrevistasRecentes: entrevistas || []
    })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}