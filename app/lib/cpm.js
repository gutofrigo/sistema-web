// Calculo de caminho critico (CPM) por Fim-Inicio, a partir de uma lista de
// tarefas ({ id, data_inicio, data_entrega }) e dependencias ({ tarefa_id, predecessor_id }).
// Duracao de cada tarefa vem de data_entrega - data_inicio (minimo 1 dia); sem datas, assume 1 dia.
// Ciclos sao ignorados (nao travam o calculo): tarefas fora da ordem topologica ficam sem dados de CPM.
export function calcularCaminhoCritico(tarefas, dependencias) {
  const porId = new Map(tarefas.map(t => [t.id, t]))
  const preds = new Map(tarefas.map(t => [t.id, []]))
  const sucs = new Map(tarefas.map(t => [t.id, []]))
  for (const d of dependencias || []) {
    if (!porId.has(d.tarefa_id) || !porId.has(d.predecessor_id)) continue
    preds.get(d.tarefa_id).push(d.predecessor_id)
    sucs.get(d.predecessor_id).push(d.tarefa_id)
  }

  const grauEntrada = new Map(tarefas.map(t => [t.id, preds.get(t.id).length]))
  const fila = tarefas.filter(t => grauEntrada.get(t.id) === 0).map(t => t.id)
  const ordem = []
  while (fila.length) {
    const id = fila.shift()
    ordem.push(id)
    for (const s of sucs.get(id)) {
      grauEntrada.set(s, grauEntrada.get(s) - 1)
      if (grauEntrada.get(s) === 0) fila.push(s)
    }
  }
  const cicloDetectado = ordem.length < tarefas.length
  const idsValidos = new Set(ordem)

  function duracao(id) {
    const t = porId.get(id)
    if (t.data_inicio && t.data_entrega) {
      return Math.max(1, Math.round((new Date(t.data_entrega) - new Date(t.data_inicio)) / 86400000) + 1)
    }
    return 1
  }

  const es = new Map(), ef = new Map()
  for (const id of ordem) {
    const valoresPred = preds.get(id).filter(p => idsValidos.has(p)).map(p => ef.get(p) || 0)
    es.set(id, valoresPred.length ? Math.max(...valoresPred) : 0)
    ef.set(id, es.get(id) + duracao(id))
  }
  const duracaoTotalDias = ordem.length ? Math.max(...ordem.map(id => ef.get(id))) : 0

  const lf = new Map(), ls = new Map()
  for (const id of [...ordem].reverse()) {
    const valoresSuc = sucs.get(id).filter(s => idsValidos.has(s)).map(s => ls.get(s))
    lf.set(id, valoresSuc.length ? Math.min(...valoresSuc) : duracaoTotalDias)
    ls.set(id, lf.get(id) - duracao(id))
  }

  const porTarefa = new Map()
  for (const id of ordem) {
    const folgaDias = ls.get(id) - es.get(id)
    porTarefa.set(id, { es: es.get(id), ef: ef.get(id), ls: ls.get(id), lf: lf.get(id), folgaDias, critico: folgaDias === 0 })
  }
  return { porTarefa, duracaoTotalDias, cicloDetectado }
}
