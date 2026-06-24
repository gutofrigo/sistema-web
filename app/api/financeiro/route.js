import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view')

    if (view === 'totais') {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('categoria, tipo, valor, status')
        .eq('status', 'pago')
      if (error) return Response.json({ erro: error.message })

      const mapa = {}
      let totalEntradas = 0, totalSaidas = 0
      for (const l of data || []) {
        if (!mapa[l.categoria]) mapa[l.categoria] = { categoria: l.categoria, entradas: 0, saidas: 0 }
        if (l.tipo === 'entrada') { mapa[l.categoria].entradas += Number(l.valor); totalEntradas += Number(l.valor) }
        else { mapa[l.categoria].saidas += Number(l.valor); totalSaidas += Number(l.valor) }
      }
      return Response.json({
        porCategoria: Object.values(mapa).sort((a, b) => (b.saidas + b.entradas) - (a.saidas + a.entradas)),
        totalGeral: { entradas: totalEntradas, saidas: totalSaidas, saldo: totalEntradas - totalSaidas }
      })
    }

    const mes = searchParams.get('mes') || new Date().toISOString().slice(0, 7)
    const [ano, m] = mes.split('-').map(Number)
    const inicio = `${mes}-01`
    const ultimoDia = new Date(ano, m, 0).getDate()
    const fim = `${mes}-${String(ultimoDia).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .gte('data_venc', inicio)
      .lte('data_venc', fim)
      .order('data_venc', { ascending: true })
    if (error) return Response.json({ erro: error.message })

    const pagos = (data || []).filter(l => l.status === 'pago')
    const entradas = pagos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0)
    const saidas = pagos.filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)
    const proximosPagamentos = (data || [])
      .filter(l => l.status === 'pendente')
      .sort((a, b) => new Date(a.data_venc) - new Date(b.data_venc))
      .slice(0, 8)

    return Response.json({
      lancamentos: data || [],
      resumo: { entradas, saidas, saldo: entradas - saidas },
      proximosPagamentos
    })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { descricao, valor, tipo, categoria, data_venc, recorrente, status } = body
    const entries = []

    if (recorrente) {
      const base = new Date(data_venc + 'T12:00:00')
      for (let i = 0; i < 12; i++) {
        const d = new Date(base.getFullYear(), base.getMonth() + i, base.getDate())
        entries.push({
          descricao,
          valor: Number(valor),
          tipo,
          categoria,
          data_venc: d.toISOString().slice(0, 10),
          recorrente: true,
          status: 'pendente'
        })
      }
    } else {
      entries.push({ descricao, valor: Number(valor), tipo, categoria, data_venc, recorrente: false, status: status || 'pendente' })
    }

    const { data, error } = await supabase.from('lancamentos').insert(entries).select()
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true, lancamentos: data })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    const { error } = await supabase
      .from('lancamentos')
      .update({ status: body.status })
      .eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json()
    const { error } = await supabase.from('lancamentos').delete().eq('id', body.id)
    if (error) return Response.json({ erro: error.message })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ erro: e.message })
  }
}
