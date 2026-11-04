import { useEffect, useState } from 'react'
import { readData } from './db'
import type { Data } from './db'
import type { MealSlot } from './food-parser.mjs'
import { tags } from './food-parser.mjs'
import { readFoodForChecks } from './day-check-store'
import { windowReport } from './time-analysis.mjs'
import type { WindowReport } from './time-analysis.mjs'
const fmt=(v:string|number)=>new Date(v).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
export default function Analysis(){
  const [data,setData]=useState<Data>({pains:[],medications:[]});const [slots,setSlots]=useState<MealSlot[]>([]);const [selected,setSelected]=useState('')
  const [ready,setReady]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{let alive=true;Promise.all([readData(),readFoodForChecks()]).then(([d,s])=>{if(alive){setData(d);setSlots(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  const pains=[...data.pains].sort((a,b)=>b.start.localeCompare(a.start));const pain=pains.find(p=>p.id===selected)??pains[0]
  const reports=pain?[windowReport(slots,pain.start,24,0),windowReport(slots,pain.start,48,24)]:[]
  const meds=pain?data.medications.filter(m=>m.painId===pain.id||(!m.painId&&m.at>=pain.start&&m.at<=(pain.end??new Date().toISOString()))).sort((a,b)=>a.at.localeCompare(b.at)):[]
  return <main className="app food"><header><h1>Souvislosti</h1></header>{error&&<p className="alert" role="alert">{error}</p>}
    {!ready?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:!pain?<section className="card">Zatím nemáš žádnou epizodu bolesti.</section>:<>
    <section className="card"><label>Epizoda<select value={pain.id} onChange={e=>setSelected(e.target.value)}>{pains.map(p=><option key={p.id} value={p.id}>{fmt(p.start)} · {p.intensity}/10</option>)}</select></label><p>{fmt(pain.start)} → {pain.end?fmt(pain.end):'probíhá'}</p>{pain.note&&<p className="note">{pain.note}</p>}</section>
    {reports.map((r,i)=><Report key={i} report={r} title={i===0?'0–24 hodin před začátkem':'24–48 hodin před začátkem'}/>)}
    <section className="card"><h2>Léky</h2>{meds.length?meds.map(m=><p key={m.id}>{fmt(m.at)} · {m.name} · {m.count} ks{m.strength?' · '+m.strength:''}<br/><small>{m.painId===pain.id?'Přiřazené':'Podle času epizody'}</small></p>):<p>Žádné záznamy.</p>}</section></>}
  </main>
}
function Report({report,title}:{report:WindowReport;title:string}){return <section className="card"><h2>{title}</h2><p>{fmt(report.low)} → {fmt(report.high)}<br/>Import: {report.imported}/{report.expected} dnů</p>
  {!!report.missing.length&&<details><summary>Dny bez importu</summary><p>{report.missing.map(d=>d.split('-').reverse().join('.')).join(', ')}</p></details>}
  {!report.rows.length&&<p>V okně nejsou zapsaná jídla.</p>}
  {report.rows.map(row=><details key={row.slot.key}><summary>{row.slot.day.split('-').reverse().join('.')} · {row.slot.category} · {row.status==='inside'?'celý interval':'možný překryv'}</summary><p>{fmt(row.start)} – {fmt(row.end)}</p>{row.slot.items.map((item,i)=><article className="food-item" key={i}><h3>{item.name}</h3><p>{item.amount}{tags(item.name).length?' · '+tags(item.name).join(' · '):''}</p>{!!item.ingredients.length&&<ul>{item.ingredients.map((x,j)=><li key={j}>{x.name} — {x.amount}</li>)}</ul>}</article>)}</details>)}
</section>}
