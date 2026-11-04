import { useEffect, useState } from 'react'
import { followUp } from './follow-up.mjs'
import type { FollowStatus } from './follow-up.mjs'
import { loadFollowUp } from './follow-up-store'
const fmt=(v:number)=>new Date(v).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
const labels:Record<FollowStatus,string>={free:'Bez bolesti',pain:'Bolest v období',running:'Probíhá',unknown:'Chybí údaje'}
export default function FollowUp(){
  const [loaded,setLoaded]=useState<Awaited<ReturnType<typeof loadFollowUp>>|null>(null)
  const [error,setError]=useState('');const [kind,setKind]=useState<'food'|'ingredient'>('food');const [search,setSearch]=useState('')
  const [now,setNow]=useState(()=>Date.now())
  useEffect(()=>{let alive=true;loadFollowUp().then(d=>{if(alive)setLoaded(d)}).catch(e=>{if(alive)setError(String(e))});const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{alive=false;clearInterval(timer)}},[])
  const rows=loaded?followUp(loaded.slots,loaded.data.pains,loaded.checks,kind,Intl.DateTimeFormat().resolvedOptions().timeZone,now):[]
  const query=search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ')
  const shown=rows.filter(r=>r.key.includes(query))
  return <main className="app food"><header><h1>48 hodin po jídle</h1></header>
    {error&&<p className="alert" role="alert">{error}</p>}
    {!loaded?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:<>
    <section className="card"><label>Zobrazit<select value={kind} onChange={e=>setKind(e.target.value as 'food'|'ingredient')}><option value="food">Jídla a potraviny</option><option value="ingredient">Suroviny z receptů</option></select></label><input className="compact-input" type="search" aria-label="Hledat potravinu" placeholder="Hledat" value={search} onChange={e=>setSearch(e.target.value)}/><p className="muted">Překrývající se konzumace tvoří jedno období.</p></section>
    {!shown.length&&<section className="card">Žádné položky pro tento výběr.</section>}
    {shown.map(row=><section className="card" key={row.key}><h2>{row.name}</h2><p>{row.occasions} konzumací · {row.days} dnů · {row.groups.length} období</p><div className="follow-counts">{(['free','pain','running','unknown'] as const).map(status=><div key={status}><span>{labels[status]}</span><strong>{row[status]}</strong></div>)}</div>
      <details><summary>Období a konzumace</summary>{[...row.groups].reverse().map(group=><div className="food-item" key={group.from}><h3>{labels[group.status]}</h3><p>{fmt(group.from)} → {fmt(group.until)}</p>{group.status==='pain'&&<p>{group.painBefore?'Bolest probíhala už na začátku období.':'Bolest zaznamenaná během období.'}</p>}{!!group.missingDays.length&&<p>Doplň kontrolu dnů: {group.missingDays.map(d=>d.split('-').reverse().join('.')).join(', ')}</p>}<ul>{group.exposures.map((e,i)=><li key={i}>{e.day.split('-').reverse().join('.')} · {e.category} · {e.amounts.join(' + ')}</li>)}</ul></div>)}</details>
    </section>)}
    </>}
  </main>
}
