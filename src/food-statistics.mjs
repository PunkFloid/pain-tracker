import { windowReport } from './time-analysis.mjs'
const normalized=s=>s.normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('cs-CZ')
function entries(slot,kind){return slot.items.flatMap(item=>kind==='food'?[item]:item.ingredients)}
export function foodStatistics(slots,pains,kind,olderHours,newerHours,includePartial=false){
  const index=new Map()
  for(const slot of slots)for(const item of entries(slot,kind)){
    const key=normalized(item.name);if(!key)continue
    if(!index.has(key))index.set(key,{key,name:item.name,days:new Set(),hits:[]})
    index.get(key).days.add(slot.day)
  }
  let eligible=0,partial=0,noData=0,incomplete=0
  for(const pain of pains){
    const report=windowReport(slots,pain.start,olderHours,newerHours)
    if(!report.imported){noData++;continue}
    if(report.missing.length&&!includePartial){incomplete++;continue}
    eligible++;if(report.missing.length)partial++
    const seen=new Map()
    for(const row of report.rows)for(const item of entries(row.slot,kind)){
      const key=normalized(item.name)
      if(!seen.has(key)||row.status==='inside')seen.set(key,row.status)
    }
    for(const [key,status] of seen){const entry=index.get(key);if(entry)entry.hits.push({painId:pain.id,start:pain.start,status})}
  }
  const rows=[...index.values()].map(entry=>({key:entry.key,name:entry.name,days:entry.days.size,hits:entry.hits,inside:entry.hits.filter(h=>h.status==='inside').length,possible:entry.hits.filter(h=>h.status==='possible').length,total:entry.hits.length})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total||b.inside-a.inside||a.name.localeCompare(b.name,'cs'))
  return {totalPains:pains.length,eligible,partial,noData,incomplete,importedDays:new Set(slots.map(s=>s.day)).size,rows}
}
