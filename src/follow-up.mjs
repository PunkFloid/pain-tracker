import { mealTimes } from './food-parser.mjs'
import { assessCheck, checkModes, HEADACHE_START, localDay } from './day-check-logic.mjs'
import { trackedIdentity } from './naming-rules.mjs'
function dates(from,until){const result=[];const d=new Date(from);d.setHours(0,0,0,0);while(d.getTime()<until){result.push(localDay(d));d.setDate(d.getDate()+1)}return result}
function overlaps(p,from,until,now){const start=Date.parse(p.start),end=p.end===null?now:Math.min(Date.parse(p.end),now);if(!Number.isFinite(start)||!Number.isFinite(end)||start>now||end<start)return false;return start===end?start>=from&&start<until:start<until&&end>from}
function evaluate(group,pains,checks,slots,zone,now){
  const relevant=pains.filter(p=>overlaps(p,group.from,group.until,now)),painBefore=relevant.some(p=>Date.parse(p.start)<group.from)
  if(relevant.length)return {...group,status:'pain',painBefore,painIds:relevant.map(p=>p.id),missingDays:[]}
  if(now<group.until)return {...group,status:'running',painBefore:false,painIds:[],missingDays:[]}
  const byDay=new Map(checks.map(c=>[c.day,c]))
  const missingDays=dates(group.from,group.until).filter(day=>{
    const check=byDay.get(day)??null,mode=checkModes(check).headache
    if(mode==='unknown'||(mode==='auto'&&day<HEADACHE_START))return true
    const status=assessCheck(day,check,pains,slots,zone,new Date(now))
    return !['confirmed-free','assumed-free','recorded-pain'].includes(status.headache)
  })
  return {...group,status:missingDays.length?'unknown':'free',painBefore:false,painIds:[],missingDays}
}
export function followUp(slots,pains,checks,kind='food',zone=Intl.DateTimeFormat().resolvedOptions().timeZone,now=Date.now()){
  const index=new Map()
  for(const slot of slots){const times=mealTimes[slot.category];if(!times)continue
    const from=new Date(`${slot.day}T${times[0]}:00`).getTime(),mealEnd=new Date(`${slot.day}T${times[1]}:00`).getTime()
    if(!Number.isFinite(from)||!Number.isFinite(mealEnd)||mealEnd<from)continue
    for(const parent of slot.items)for(const item of kind==='food'?[parent]:parent.ingredients){const {key,name}=trackedIdentity(item);if(!key)continue
      if(!index.has(key))index.set(key,{key,name,occasions:new Map()});const occasions=index.get(key).occasions
      if(!occasions.has(slot.key))occasions.set(slot.key,{day:slot.day,category:slot.category,from,mealEnd,until:mealEnd+48*3600000,amounts:[]});occasions.get(slot.key).amounts.push(item.amount)
    }
  }
  return [...index.values()].map(entry=>{const exposures=[...entry.occasions.values()].sort((a,b)=>a.from-b.from),groups=[]
    for(const exposure of exposures){const last=groups[groups.length-1];const sameEra=last&&(localDay(new Date(last.from))>=HEADACHE_START)===(exposure.day>=HEADACHE_START)
      if(last&&sameEra&&exposure.from<last.until){last.until=Math.max(last.until,exposure.until);last.exposures.push(exposure)}else groups.push({from:exposure.from,until:exposure.until,exposures:[exposure]})
    }
    const evaluated=groups.map(g=>evaluate(g,pains,checks,slots,zone,now))
    return {key:entry.key,name:entry.name,days:new Set(exposures.map(e=>e.day)).size,occasions:exposures.length,groups:evaluated,free:evaluated.filter(g=>g.status==='free').length,pain:evaluated.filter(g=>g.status==='pain').length,running:evaluated.filter(g=>g.status==='running').length,unknown:evaluated.filter(g=>g.status==='unknown').length}
  }).sort((a,b)=>b.occasions-a.occasions||a.name.localeCompare(b.name,'cs'))
}
