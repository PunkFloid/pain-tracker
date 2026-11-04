import { mealTimes } from './food-parser.mjs'
export function relation(start,end,low,high){
  if(end<low||start>=high)return 'none'
  return start>=low&&end<high?'inside':'possible'
}
export function dayKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function bounds(slot,times){
  const t=times[slot.category];if(!t)return null
  const start=new Date(`${slot.day}T${t[0]}:00`).getTime()
  const end=new Date(`${slot.day}T${t[1]}:00`).getTime()
  return Number.isFinite(start)&&Number.isFinite(end)&&end>=start?{start,end}:null
}
export function windowReport(slots,onset,olderHours,newerHours,times=mealTimes){
  const at=Date.parse(onset);if(!Number.isFinite(at))throw new Error('Neplatný začátek bolesti.')
  const low=at-olderHours*3600000,high=at-newerHours*3600000
  const rows=slots.flatMap(slot=>{
    const b=bounds(slot,times);if(!b||!slot.items.length)return []
    const status=relation(b.start,b.end,low,high)
    return status==='none'?[]:[{slot,...b,status}]
  }).sort((a,b)=>a.start-b.start)
  const expected=[];const cursor=new Date(low);cursor.setHours(0,0,0,0)
  while(cursor.getTime()<high){
    for(const category of Object.keys(times)){
      const slot={day:dayKey(cursor),category};const b=bounds(slot,times)
      if(b&&relation(b.start,b.end,low,high)!=='none')expected.push(slot.day+'|'+category)
    }
    cursor.setDate(cursor.getDate()+1)
  }
  const available=new Set(slots.map(s=>s.key))
  return {low,high,rows,expected:expected.length,imported:expected.filter(k=>available.has(k)).length,missing:expected.filter(k=>!available.has(k))}
}
