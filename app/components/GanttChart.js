import { theme as C } from '../theme'

const NOMES_MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function fmt(d) {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.getDate().toString().padStart(2,'0') + '/' + (dt.getMonth()+1).toString().padStart(2,'0')
}
export function parseData(s) {
  if (!s) return null
  return new Date(s + 'T12:00:00')
}

export function GanttChart({ itens, colunaLabel, getCor, getLabel, getSubLabel, colNome }) {
  const hoje = new Date()
  hoje.setHours(12,0,0,0)
  const datas = itens.flatMap(i => [i.inicio, i.fim]).filter(Boolean)
  if (datas.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px', color: C.textoMudo, fontSize: '14px' }}>
      Nenhuma tarefa com data definida
    </div>
  )
  const minDate = new Date(Math.min(...datas))
  const maxDate = new Date(Math.max(...datas))
  minDate.setDate(minDate.getDate() - 2)
  maxDate.setDate(maxDate.getDate() + 3)
  const totalDias = Math.ceil((maxDate - minDate) / 86400000)
  const dias = []
  for (let i = 0; i <= totalDias; i++) {
    const d = new Date(minDate)
    d.setDate(minDate.getDate() + i)
    dias.push(d)
  }
  const colW = Math.max(Math.floor(480 / totalDias), 12)
  const nomesCol = colNome || 160
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: nomesCol + dias.length * colW + 'px' }}>
        <div style={{ display: 'flex', borderBottom: `1.5px solid ${C.borda}`, marginBottom: '4px' }}>
          <div style={{ width: nomesCol + 'px', flexShrink: 0, fontSize: '12px', color: C.textoSec, paddingBottom: '4px' }}>{colunaLabel}</div>
          <div style={{ display: 'flex' }}>
            {dias.map((d, i) => {
              const isHoje = d.toDateString() === hoje.toDateString()
              const prevMes = i > 0 ? dias[i-1].getMonth() : -1
              return (
                <div key={i} style={{ width: colW + 'px', textAlign: 'center', fontSize: '10px', color: isHoje ? C.vermelho : C.textoMudo, background: isHoje ? '#fef2f2' : '', borderLeft: isHoje ? `1.5px solid ${C.vermelho}` : `0.5px solid ${C.fundo}`, padding: '2px 0', boxSizing: 'border-box' }}>
                  {d.getMonth() !== prevMes && <span style={{ fontWeight: 'bold', color: isHoje ? C.vermelho : C.royal, display: 'block', fontSize: '10px' }}>{NOMES_MES[d.getMonth()]}</span>}
                  {d.getDate()}
                </div>
              )
            })}
          </div>
        </div>
        {itens.map((item, idx) => {
          if (!item.inicio || !item.fim) return null
          const startOffset = Math.max(0, Math.ceil((item.inicio - minDate) / 86400000))
          const duracao = Math.max(1, Math.ceil((item.fim - item.inicio) / 86400000))
          const cor = getCor(item, idx)
          const label = getLabel(item)
          const sub = getSubLabel(item)
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: `0.5px solid ${C.fundo}` }}>
              <div style={{ width: nomesCol + 'px', flexShrink: 0, paddingRight: '12px' }}>
                <p style={{ fontSize: '13px', margin: '0 0 1px', color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titulo}</p>
                <p style={{ fontSize: '11px', color: C.textoMudo, margin: 0 }}>{sub}</p>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ display: 'flex' }}>
                  {dias.map((d, i) => {
                    const isHoje = d.toDateString() === hoje.toDateString()
                    return <div key={i} style={{ width: colW + 'px', height: '28px', borderLeft: isHoje ? `1.5px solid ${C.vermelho}` : `0.5px solid ${C.fundo}`, background: isHoje ? '#fff8f8' : '', boxSizing: 'border-box', flexShrink: 0 }}></div>
                  })}
                </div>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: (startOffset * colW) + 'px', width: (duracao * colW) + 'px', height: '20px', background: cor, borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 8px', boxSizing: 'border-box', zIndex: 1, minWidth: '20px' }}>
                  <span style={{ fontSize: '10px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
