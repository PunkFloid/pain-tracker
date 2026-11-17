import { foodFollowUp } from './food-follow-up.mjs'
const KEY='pain-tracker-food-suggestion-decisions'
export const FOOD_RULES=Object.freeze({version:2,minConsumptions:10,minSpanDays:14,minFreeFraction:0.9,suspectPainFraction:0.5,baseline:'observed-meal-windows-matched-by-category'})
function completed(groups,now){return groups.filter(g=>g.until<=now&&!g.painBefore&&(g.status==='free'||g.status==='pain'))}
export function foodSuggestion(row,baseline,review,pains,now=Date.now()){
  const status=review?.status??'watch'
  if(status==='suspect')return null
  const done=completed(row.groups,now),exposures=done.flatMap(g=>g.exposures.map(e=>({e,g})))
  const n=exposures.length,free=exposures.filter(x=>x.g.status==='free').length
  const ids=[...new Set(done.filter(g=>g.status==='pain').flatMap(g=>g.painIds))].sort()
  const days=exposures.map(x=>Date.parse(x.e.day+'T00:00:00Z')).sort((a,b)=>a-b)
  const span=days.length?(days[days.length-1]-days[0])/864e5:0
  const cats=new Map()
  for(const g of completed(baseline,now))for(const e of g.exposures){const v=cats.get(e.category)??{pain:0,total:0};v.total++;if(g.status==='pain')v.pain++;cats.set(e.category,v)}
  const comparable=n>0&&exposures.every(x=>cats.has(x.e.category))
  const baseRate=comparable?exposures.reduce((sum,x)=>{const b=cats.get(x.e.category);return sum+b.pain/b.total},0)/n:null
  const painRate=n?(n-free)/n:0
  const signal=n>0&&(n-free)>n*FOOD_RULES.suspectPainFraction
  let type=null
  if(status==='ok'&&signal){const newIds=review?.acceptedPainIds?ids.filter(id=>!review.acceptedPainIds.includes(id)):ids.filter(id=>{const p=pains.find(p=>p.id===id);return p&&Date.parse(p.start)>Date.parse(review?.statusChangedAt??review?.updatedAt??'')});if(newIds.length)type='recheck'}
  if(status==='watch'){if(signal)type='suspect';else if(n>=FOOD_RULES.minConsumptions&&span>=FOOD_RULES.minSpanDays&&free/n>=FOOD_RULES.minFreeFraction)type='ok'}
  if(!type)return null
  const evidence=done.map(g=>[g.from,g.until,g.status,[...g.painIds].sort()]).sort((a,b)=>a[0]-b[0])
  const fingerprint=JSON.stringify([FOOD_RULES.version,type,review?.statusChangedAt??'',evidence])
  return {type,target:type==='recheck'?'watch':type,source:status,name:row.name,key:row.key,completed:n,free,spanDays:span,episodeIds:ids,painRate,baselineRate:baseRate,fingerprint}
}
export function foodSuggestions(data,kind,reviews,legacy,zone,now=Date.now()){
  const {slots,checks}=data,{pains,medications}=data.data
  const marker=slots.map(s=>({...s,items:[{name:'__food_tracker_baseline__',amount:'',kcal:0,ingredients:[]}]}))
  const baseline=foodFollowUp(marker,pains,checks,medications,'food',zone,now)[0]?.groups??[]
  return foodFollowUp(slots,pains,checks,medications,kind,zone,now).flatMap(row=>{
    const id=kind+'|'+row.key,review=reviews.items[id]
    if(legacy.includes(id)&&!review?.status)return []
    const proposal=foodSuggestion(row,baseline,review,pains,now)
    return proposal?[{...proposal,id,kind}]:[]
  })
}
export function readSuggestionDecisions(storage=localStorage){const raw=storage.getItem(KEY);if(raw===null)return {version:1,items:{}};const d=JSON.parse(raw);if(!d||d.version!==1||!d.items||typeof d.items!=='object'||Array.isArray(d.items)||Object.values(d.items).some(v=>typeof v!=='string'))throw new Error('Neplatná data zamítnutých návrhů.');return d}
export function dismissFoodSuggestion(suggestion,storage=localStorage){const d=readSuggestionDecisions(storage),next={version:1,items:{...d.items,[suggestion.id+'|'+suggestion.type]:suggestion.fingerprint}};storage.setItem(KEY,JSON.stringify(next));return next}
