import type { Data, Pain, Medication } from './db'
import EpisodeFoods from './EpisodeFoods'
import { medicationsForPain } from './pain-medication.mjs'
import './history.css'
export type HistoryEntry={kind:'pain';item:Pain}|{kind:'med';item:Medication}
type Props={data:Data;busy:boolean;edit:(e:HistoryEntry)=>void;remove:(kind:'pain'|'med',id:string)=>void}
const DAY=864e5
const dec=(n:number)=>n.toFixed(1).replace('.',',')
const stamp=(s:string)=>new Date(s).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
function dayKey(t:number|string){const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function period(data:Data,from:number,to:number,now:number){
  const ps=data.pains.filter(p=>Date.parse(p.start)>=from&&Date.parse(p.start)<to)
  const ms=data.medications.filter(m=>Date.parse(m.at)>=from&&Date.parse(m.at)<to)
  const days=new Set<string>(),painDays=new Set<string>()
  for(let t=from;t<to;t+=DAY){const k=dayKey(t);if(k>='2026-10-29')days.add(k)}
  for(const p of data.pains){const s=Date.parse(p.start),e=p.end?Date.parse(p.end):now;if(e<from||s>=to)continue;for(let t=s;t<=e;t+=DAY)painDays.add(dayKey(t));painDays.add(dayKey(e))}
  return {episodes:ps.length,avg:ps.length?ps.reduce((a,p)=>a+p.intensity,0)/ps.length:null,meds:ms.length,free:days.size?[...days].filter(d=>!painDays.has(d)).length:null,names:ms}
}
function medicationCounts(meds:Medication[]){const map=new Map<string,number>();for(const m of meds)map.set(m.name,(map.get(m.name)??0)+1);return [...map].sort((a,b)=>b[1]-a[1])}
export default function PainHistory({data,busy,edit,remove}:Props){
  const now=Date.now(),current=period(data,now-30*DAY,now+1,now),previous=period(data,now-60*DAY,now-30*DAY,now)
  const events:HistoryEntry[]=[...data.pains.map(item=>({kind:'pain' as const,item})),...data.medications.map(item=>({kind:'med' as const,item}))]
  const at=(e:HistoryEntry)=>e.kind==='pain'?e.item.start:e.item.at
  events.sort((a,b)=>Date.parse(at(b))-Date.parse(at(a)))
  const latest=events.find((e):e is Extract<HistoryEntry,{kind:'pain'}>=>e.kind==='pain')
  const months=new Map<string,HistoryEntry[]>()
  for(const e of events){const k=dayKey(at(e)).slice(0,7);months.set(k,[...(months.get(k)??[]),e])}
  const actions=(e:HistoryEntry)=><div className="history-actions"><button disabled={busy} onClick={()=>edit(e)}>Upravit</button><button className="danger" disabled={busy} onClick={()=>remove(e.kind,e.item.id)}>Smazat</button></div>
  const medicines=(pain:Pain)=>{const meds=medicationsForPain(pain,data.medications,now);return meds.length?<ul className="history-meds">{meds.map(m=><li key={m.id}><div><span>{m.name}</span><span className="history-subline">{stamp(m.at)}{m.strength?' · '+m.strength:''}</span></div><span className="history-amount">{m.count} ks</span></li>)}</ul>:<p className="history-subline">{pain.end?'Bez léků':'Zatím bez léků'}</p>}
  const details=(e:HistoryEntry)=><div className="history-detail">{e.item.note&&<p className="note">{e.item.note}</p>}{e.kind==='pain'?<><p className="history-subline">{stamp(e.item.start)} → {e.item.end?stamp(e.item.end):'probíhá'}</p>{medicines(e.item)}{medicationsForPain(e.item,data.medications,now).length>0&&<EpisodeFoods start={e.item.start}/>}</>:<p className="history-subline">{e.item.strength||'Síla neuvedena'} · {e.item.painId?'Přiřazeno k bolesti':'Samostatný záznam'}</p>}{actions(e)}</div>
  const tile=(v:string,label:string,p:string)=><div className="history-metric"><span className="history-value">{v}</span><span>{label}</span><span className="history-subline">Předtím {p}</span></div>
  return <section className="history-view"><div className="history-heading"><h2>Historie</h2><span className="history-subline">Posledních 30 dní</span></div>
    {!events.length?<section className="card">Zatím žádné záznamy.</section>:<>
    <section className="card history-overview"><div className="history-grid">{tile(String(current.episodes),'Epizody',String(previous.episodes))}{tile(current.free===null?'–':String(current.free),'Dnů bez bolesti',previous.free===null?'–':String(previous.free))}{tile(current.avg===null?'–':dec(current.avg),'Průměrná intenzita',previous.avg===null?'–':dec(previous.avg))}{tile(String(current.meds),'Užití léků',String(previous.meds))}</div>{current.names.length>0&&<details className="history-drug-summary"><summary>Přehled léků</summary><ul className="history-meds">{medicationCounts(current.names).map(([name,n])=><li key={name}><span>{name}</span><span>{n}×</span></li>)}</ul></details>}</section>
    {latest&&<section className="card history-latest"><div className="history-card-heading"><div><span className="history-eyebrow">Poslední bolest hlavy</span><h3>{new Date(latest.item.start).toLocaleDateString('cs-CZ',{day:'numeric',month:'long',year:'numeric'})}</h3></div><span className="history-intensity">{latest.item.intensity}/10</span></div><p className="history-subline">{stamp(latest.item.start)} → {latest.item.end?stamp(latest.item.end):'probíhá'}</p>{medicines(latest.item)}<details className="history-more"><summary>Detail a úpravy</summary><div className="history-detail">{latest.item.note&&<p className="note">{latest.item.note}</p>}{medicationsForPain(latest.item,data.medications,now).length>0&&<EpisodeFoods start={latest.item.start}/ >}{actions(latest)}</div></details></section>}
    <h3 className="history-section-title">Podle měsíců</h3>
    {[...months].map(([key,list])=>{const ps=list.filter((e):e is Extract<HistoryEntry,{kind:'pain'}>=>e.kind==='pain'),ms=list.filter(e=>e.kind==='med');const avg=ps.length?dec(ps.reduce((s,e)=>s+e.item.intensity,0)/ps.length):'–';return <details className="card history-month" key={key}><summary><span className="history-month-title">{new Date(key+'-01T12:00:00').toLocaleDateString('cs-CZ',{month:'long',year:'numeric'})}</span><span className="history-month-meta">Epizody {ps.length} <span>Ø {avg}</span> <span>Užití léků {ms.length}</span></span></summary><div className="history-timeline">{list.map(e=><details className="history-event" key={e.kind+e.item.id}><summary><span className="history-event-top"><span>{e.kind==='pain'?'Bolest hlavy':e.item.name}</span><span className="history-amount">{e.kind==='pain'?`${e.item.intensity}/10`:`${e.item.count} ks`}</span></span><span className="history-subline">{stamp(at(e))}</span></summary>{details(e)}</details>)}</div></details>})}
    </>}
  </section>
}
