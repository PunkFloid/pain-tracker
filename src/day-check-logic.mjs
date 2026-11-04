import { mealTimes, signature } from './food-parser.mjs'
export function localDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`}
export function previousDay(now=new Date()){const d=new Date(now);d.setDate(d.getDate()-1);return localDay(d)}
export function dayBounds(day){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Neplatné datum.')
  const start=new Date(day+'T00:00:00')
  if(!Number.isFinite(start.getTime())||localDay(start)!==day)throw new Error('Neplatné datum.')
  const end=new Date(start);end.setDate(end.getDate()+1)
  return {start:start.getTime(),end:end.getTime()}
}
export function painsInDay(day,pains){
  const b=dayBounds(day)
  return pains.filter(p=>{
    const start=Date.parse(p.start),end=p.end===null?Infinity:Date.parse(p.end)
    if(!Number.isFinite(start)||Number.isNaN(end)||end<start)throw new Error('Některá epizoda má neplatný čas. Oprav ji v historii.')
    return start===end?start>=b.start&&start<b.end:start<b.end&&end>b.start
  })
}
export function foodSnapshot(day,slots){
  const daySlots=slots.filter(s=>s.day===day)
  return {available:Object.keys(mealTimes).every(c=>daySlots.some(s=>s.category===c)),signature:JSON.stringify(daySlots.map(s=>[s.category,signature(s)]).sort((a,b)=>a[0].localeCompare(b[0])))}
}
export function validateCheck(check,pains,slots,now=new Date()){
  dayBounds(check.day);const errors=[]
  if(check.day>=localDay(now))errors.push('Potvrdit lze pouze ukončené minulé dny, ne dnešek ani budoucnost.')
  if(!['none','pain','unknown'].includes(check.headache)||!['complete','incomplete','unknown'].includes(check.food))errors.push('Neplatný stav kontroly.')
  if(check.headache==='none'&&painsInDay(check.day,pains).length)errors.push('Do dne zasahuje záznam bolesti. Oprav epizodu, nebo zvol bolest během dne.')
  if(check.food==='complete'&&!foodSnapshot(check.day,slots).available)errors.push('Pro potvrzení úplnosti nejprve importuj všech šest kategorií dne, včetně skutečně vynechaných jídel.')
  return errors
}
export function assessCheck(day,check,pains,slots,zone,now=new Date()){
  const count=painsInDay(day,pains).length
  if(!check)return {headache:'unconfirmed',food:'unconfirmed',painCount:count}
  const review=check.day!==day||day>=localDay(now)||check.zone!==zone
  let headache='unconfirmed',food='unconfirmed'
  if(check.headache==='none')headache=count?'conflict':review?'review':'confirmed-free'
  if(check.headache==='pain')headache=review?'review':count?'recorded-pain':'needs-episode'
  if(check.food==='incomplete')food='incomplete'
  if(check.food==='complete'){
    const snapshot=foodSnapshot(day,slots)
    food=review||!snapshot.available||snapshot.signature!==check.foodSignature?'review':'complete'
  }
  return {headache,food,painCount:count}
}
