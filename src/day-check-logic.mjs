import { signature } from './food-parser.mjs'
export const HEADACHE_START='2026-10-29'
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
  return pains.filter(p=>{const start=Date.parse(p.start),end=p.end===null?Infinity:Date.parse(p.end)
    if(!Number.isFinite(start)||Number.isNaN(end)||end<start)throw new Error('Některá epizoda má neplatný čas. Oprav ji v historii.')
    return start===end?start>=b.start&&start<b.end:start<b.end&&end>b.start
  })
}
export function foodSnapshot(day,slots){const daySlots=slots.filter(s=>s.day===day);return {available:daySlots.length>0,signature:JSON.stringify(daySlots.map(s=>[s.category,signature(s)]).sort((a,b)=>a[0].localeCompare(b[0])))}}
export function checkModes(check){return {
  headache:!check||(check.version===1&&check.headache==='unknown')?'auto':check.headache,
  food:!check||(check.version===1&&check.food==='unknown')?'auto':check.food,
}}
export function validateCheck(check,pains,_slots,now=new Date()){
  dayBounds(check.day);const errors=[]
  if(check.day>localDay(now))errors.push('Budoucí den nelze upravit.')
  if(!['auto','none','pain','unknown'].includes(check.headache)||!['auto','complete','incomplete','unknown'].includes(check.food))errors.push('Neplatný stav kontroly.')
  if(check.headache==='none'&&painsInDay(check.day,pains).length)errors.push('V tomto dni je zaznamenaná bolest. Uprav epizodu nebo zvol Automaticky.')
  return errors
}
export function assessCheck(day,check,pains,slots,_zone,now=new Date()){
  const count=painsInDay(day,pains).length,modes=checkModes(check),today=localDay(now)
  let headache='unconfirmed',food='unconfirmed'
  if(day<=today){
    if(count)headache='recorded-pain'
    else if(modes.headache==='none')headache='confirmed-free'
    else if(modes.headache==='pain')headache='needs-episode'
    else if(modes.headache==='auto'&&day>=HEADACHE_START)headache='assumed-free'
  }
  if(modes.food==='complete'||(modes.food==='auto'&&slots.some(s=>s.day===day)))food='complete'
  else if(modes.food==='incomplete')food='incomplete'
  return {headache,food,painCount:count}
}
