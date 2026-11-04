import { Fragment, useEffect, useMemo, useState } from 'react'
import { readData } from './db'
import type { Data } from './db'
import type { MealSlot } from './food-parser.mjs'
import { readFoodForChecks } from './day-check-store'
import { foodStatistics } from './food-statistics.mjs'
const fmt=(s:string)=>new Date(s).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})
export default function Statistics(){
  const [data,setData]=useState<Data>({pains:[],medications:[]});const [slots,setSlots]=useState<MealSlot[]>([])
  const [ready,setReady]=useState(false);const [error,setError]=useState('')
  const [kind,setKind]=useState<'food'|'ingredient'>('food');const [range,setRange]=useState('48');const [partial,setPartial]=useState(false);const [search,setSearch]=useState('');const [open,setOpen]=useState('')
  useEffect(()=>{let alive=true;Promise.all([readData(),readFoodForChecks()]).then(([d,s])=>{if(alive){setData(d);setSlots(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  const result=useMemo(()=>foodStatistics(slots,data.pains,kind,range==='24'?24:48,range==='older'?24:0,partial),[slots,data.pains,kind,range,partial])
  const rows=result.rows.filter(r=>r.key.includes(search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ')))
  return <main className="app food compact-view" aria-label="Potraviny před bolestí">{error&&<p className="alert" role="alert">{error}</p>}
    {!ready?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:<>
    <section className="card"><div className="compact-filters"><label>Zobrazit<select value={kind} onChange={e=>{setKind(e.target.value as 'food'|'ingredient');setOpen('')}}><option value="food">Jídla a potraviny</option><option value="ingredient">Suroviny z receptů</option></select></label><label>Okno<select value={range} onChange={e=>{setRange(e.target.value);setOpen('')}}><option value="48">0–48 hodin</option><option value="24">0–24 hodin</option><option value="older">24–48 hodin</option></select></label></div><input className="compact-input" type="search" aria-label="Hledat název" placeholder="Hledat" value={search} onChange={e=>setSearch(e.target.value)}/><details><summary>Další filtry</summary><label className="check"><input type="checkbox" checked={partial} onChange={e=>setPartial(e.target.checked)}/>Zahrnout okna s chybějícími dny</label><p>Bez importu: {result.noData} · Chybí dny: {result.incomplete} · Zahrnutá neúplná okna: {result.partial}</p></details></section>
    <p className="table-meta">Vyhodnoceno {result.eligible}/{result.totalPains} epizod. Výskyty včetně možných překryvů.</p>
    <section className="card table-card"><table className="data-table before-table"><caption className="sr-only">Četnost potravin před epizodami bolesti</caption><thead><tr><th scope="col">Položka</th><th scope="col">Epizody</th><th scope="col">Dny</th></tr></thead><tbody>
    {!rows.length&&<tr><td className="empty-cell" colSpan={3}>Žádné výsledky.</td></tr>}
    {rows.map(r=><Fragment key={r.key}><tr className={open===r.key?'is-open':''}><td><button className="row-toggle" aria-label={'Detail: '+r.name} aria-expanded={open===r.key} onClick={()=>setOpen(open===r.key?'':r.key)}><span className="item-name">{r.name}</span></button></td><td>{r.total}/{result.eligible}</td><td>{r.days}/{result.importedDays}</td></tr>{open===r.key&&<tr className="detail-row"><td colSpan={3}><div className="detail-content"><h3>{r.name}</h3><p>Celý interval: {r.inside} · Možný překryv: {r.possible}<br/>V jídelníčku: {r.days}/{result.importedDays} dnů.</p><ul>{r.hits.map(h=><li key={h.painId}>{fmt(h.start)} · {h.status==='inside'?'celý interval':'možný překryv'}</li>)}</ul></div></td></tr>}</Fragment>)}
    </tbody></table></section></>}
  </main>
}
