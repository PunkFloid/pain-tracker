import { useEffect, useState } from 'react'
import { readData } from './db'
import type { Data } from './db'
import type { MealSlot } from './food-parser.mjs'
import { readFoodForChecks } from './day-check-store'
import { foodStatistics } from './food-statistics.mjs'
const fmt=(s:string)=>new Date(s).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})
export default function Statistics(){
  const [data,setData]=useState<Data>({pains:[],medications:[]});const [slots,setSlots]=useState<MealSlot[]>([])
  const [ready,setReady]=useState(false);const [error,setError]=useState('')
  const [kind,setKind]=useState<'food'|'ingredient'>('food');const [range,setRange]=useState('48');const [partial,setPartial]=useState(false);const [search,setSearch]=useState('')
  useEffect(()=>{let alive=true;Promise.all([readData(),readFoodForChecks()]).then(([d,s])=>{if(alive){setData(d);setSlots(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  const result=foodStatistics(slots,data.pains,kind,range==='24'?24:48,range==='older'?24:0,partial)
  const rows=result.rows.filter(r=>r.key.includes(search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ')))
  return <main className="app food"><header><h1>Před bolestí</h1></header>{error&&<p className="alert" role="alert">{error}</p>}
    {!ready?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:<>
    <section className="card"><label>Zobrazit<select value={kind} onChange={e=>setKind(e.target.value as 'food'|'ingredient')}><option value="food">Jídla a potraviny</option><option value="ingredient">Suroviny z receptů</option></select></label><label>Okno<select value={range} onChange={e=>setRange(e.target.value)}><option value="48">0–48 hodin</option><option value="24">0–24 hodin</option><option value="older">24–48 hodin</option></select></label><label className="check"><input type="checkbox" checked={partial} onChange={e=>setPartial(e.target.checked)}/>Zahrnout okna s některými dny bez importu</label><input className="compact-input" type="search" aria-label="Hledat název" placeholder="Hledat" value={search} onChange={e=>setSearch(e.target.value)}/><p>Vyhodnoceno {result.eligible}/{result.totalPains} epizod.</p><details><summary>Vynechané epizody</summary><p>Bez importu: {result.noData}<br/>Chybí některé dny: {result.incomplete}<br/>Zahrnutá neúplná okna: {result.partial}</p></details></section>
    {!rows.length&&<section className="card">Žádné výsledky pro tento výběr.</section>}
    {rows.map(r=><section className="card" key={r.key}><h2>{r.name}</h2><p>Před {r.total}/{result.eligible} epizodami.<br/>Celý interval: {r.inside} · Možný překryv: {r.possible}<br/>V jídelníčku: {r.days}/{result.importedDays} dnů.</p><details><summary>Epizody</summary><ul>{r.hits.map(h=><li key={h.painId}>{fmt(h.start)} · {h.status==='inside'?'celý interval':'možný překryv'}</li>)}</ul></details></section>)}
    <p className="muted">Pořadí podle četnosti, nikoli rizika.</p></>}
  </main>
}
