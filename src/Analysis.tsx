import { Fragment, useEffect, useState } from 'react'
import { readData } from './db'
import type { Data } from './db'
import type { MealSlot } from './food-parser.mjs'
import { readFoodForChecks } from './day-check-store'
import { windowReport } from './time-analysis.mjs'
const fmt=(v:string|number)=>new Date(v).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
export default function Analysis(){
  const [data,setData]=useState<Data>({pains:[],medications:[]});const [slots,setSlots]=useState<MealSlot[]>([]);const [selected,setSelected]=useState('');const [open,setOpen]=useState('')
  const [ready,setReady]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{let alive=true;Promise.all([readData(),readFoodForChecks()]).then(([d,s])=>{if(alive){setData(d);setSlots(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  const pains=[...data.pains].sort((a,b)=>b.start.localeCompare(a.start));const pain=pains.find(p=>p.id===selected)??pains[0]
  const reports=pain?[windowReport(slots,pain.start,24,0),windowReport(slots,pain.start,48,24)]:[]
  const entries=reports.flatMap((report,index)=>report.rows.flatMap(row=>row.slot.items.map((item,i)=>({key:index+'|'+row.slot.key+'|'+i,item,row,index}))))
  const meds=pain?data.medications.filter(m=>m.painId===pain.id||(!m.painId&&m.at>=pain.start&&m.at<=(pain.end??new Date().toISOString()))).sort((a,b)=>a.at.localeCompare(b.at)):[]
  return <main className="app food compact-view" aria-label="Detail epizod">{error&&<p className="alert" role="alert">{error}</p>}
    {!ready?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:!pain?<section className="card">Zatím žádné epizody.</section>:<>
    <section className="card"><label>Epizoda<select value={pain.id} onChange={e=>{setSelected(e.target.value);setOpen('')}}>{pains.map(p=><option key={p.id} value={p.id}>{fmt(p.start)} · {p.intensity}/10</option>)}</select></label><p className="table-meta">{fmt(pain.start)} → {pain.end?fmt(pain.end):'probíhá'}</p>{pain.note&&<p className="note">{pain.note}</p>}</section>
    <p className="table-meta">Import: 0–24 h {reports[0].imported}/{reports[0].expected} dnů · 24–48 h {reports[1].imported}/{reports[1].expected} dnů</p>
    <section className="card table-card"><table className="data-table episode-table"><caption className="sr-only">Jídla před vybranou epizodou</caption><thead><tr><th scope="col">Jídlo</th><th scope="col">Před začátkem</th></tr></thead><tbody>
    {!entries.length&&<tr><td className="empty-cell" colSpan={2}>Bez zapsaných jídel v oknech.</td></tr>}
    {entries.map(e=><Fragment key={e.key}><tr className={open===e.key?'is-open':''}><td><button className="row-toggle" aria-label={'Detail: '+e.item.name} aria-expanded={open===e.key} onClick={()=>setOpen(open===e.key?'':e.key)}><span className="item-name">{e.item.name}</span></button></td><td>{e.index===0?'0–24 h':'24–48 h'}{e.row.status==='possible'&&<span className="cell-note">možný překryv</span>}</td></tr>{open===e.key&&<tr className="detail-row"><td colSpan={2}><div className="detail-content"><h3>{e.item.name}</h3><p>{e.row.slot.day.split('-').reverse().join('.')} · {e.row.slot.category}<br/>{e.item.amount}<br/>{fmt(e.row.start)} – {fmt(e.row.end)} · {e.row.status==='inside'?'celý interval':'možný překryv'}</p>{e.item.ingredients.length?<ul>{e.item.ingredients.map((x,i)=><li key={i}>{x.name} — {x.amount}</li>)}</ul>:<p>Receptura není rozepsaná.</p>}</div></td></tr>}</Fragment>)}
    </tbody></table></section>
    {!!reports.some(r=>r.missing.length)&&<details><summary>Dny bez importu</summary><p>{[...new Set(reports.flatMap(r=>r.missing))].map(d=>d.split('-').reverse().join('.')).join(', ')}</p></details>}
    <details><summary>Léky ({meds.length})</summary>{meds.length?<ul>{meds.map(m=><li key={m.id}>{fmt(m.at)} · {m.name} · {m.count} ks{m.strength?' · '+m.strength:''} · {m.painId===pain.id?'přiřazené':'podle času'}</li>)}</ul>:<p>Žádné záznamy.</p>}</details></>}
  </main>
}
