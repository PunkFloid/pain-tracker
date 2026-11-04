import { Fragment, useEffect, useMemo, useState } from 'react'
import { followUp } from './follow-up.mjs'
import type { FollowStatus } from './follow-up.mjs'
import { loadFollowUp } from './follow-up-store'
const fmt=(v:number)=>new Date(v).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
const labels:Record<FollowStatus,string>={free:'Bez bolesti',pain:'Bolest v období',running:'Probíhá',unknown:'Chybí údaje'}
export default function FollowUp(){
  const [loaded,setLoaded]=useState<Awaited<ReturnType<typeof loadFollowUp>>|null>(null)
  const [error,setError]=useState('');const [kind,setKind]=useState<'food'|'ingredient'>('food');const [search,setSearch]=useState('');const [open,setOpen]=useState('');const [now,setNow]=useState(()=>Date.now())
  useEffect(()=>{let alive=true;loadFollowUp().then(d=>{if(alive)setLoaded(d)}).catch(e=>{if(alive)setError(String(e))});const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{alive=false;clearInterval(timer)}},[])
  const rows=useMemo(()=>loaded?followUp(loaded.slots,loaded.data.pains,loaded.checks,kind,Intl.DateTimeFormat().resolvedOptions().timeZone,now):[],[loaded,kind,now])
  const query=search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ');const shown=rows.filter(r=>r.key.includes(query))
  return <main className="app food compact-view" aria-label="Sledování po jídle">{error&&<p className="alert" role="alert">{error}</p>}
    {!loaded?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:<>
    <section className="card"><label>Zobrazit<select value={kind} onChange={e=>{setKind(e.target.value as 'food'|'ingredient');setOpen('')}}><option value="food">Jídla a potraviny</option><option value="ingredient">Suroviny z receptů</option></select></label><input className="compact-input" type="search" aria-label="Hledat potravinu" placeholder="Hledat" value={search} onChange={e=>setSearch(e.target.value)}/></section>
    <section className="card table-card"><table className="data-table after-table"><caption>48hodinové sledování · počty období</caption><thead><tr><th scope="col">Položka</th><th scope="col">Bez bolesti</th><th scope="col">Bolest</th><th scope="col">Běží</th><th scope="col">Chybí údaje</th></tr></thead><tbody>
    {!shown.length&&<tr><td className="empty-cell" colSpan={5}>Žádné položky.</td></tr>}
    {shown.map(row=><Fragment key={row.key}><tr className={open===row.key?'is-open':''}><td><button className="row-toggle" aria-label={'Detail: '+row.name} aria-expanded={open===row.key} onClick={()=>setOpen(open===row.key?'':row.key)}><span className="item-name">{row.name}</span></button></td><td>{row.free}</td><td>{row.pain}</td><td>{row.running}</td><td>{row.unknown}</td></tr>{open===row.key&&<tr className="detail-row"><td colSpan={5}><div className="detail-content"><h3>{row.name}</h3><p>{row.occasions} konzumací · {row.days} dnů · {row.groups.length} období</p>{[...row.groups].reverse().map(group=><details key={group.from}><summary>{labels[group.status]} · {fmt(group.from)} → {fmt(group.until)}</summary>{group.status==='pain'&&<p>{group.painBefore?'Bolest už na začátku období.':'Bolest během období.'}</p>}{!!group.missingDays.length&&<p>Doplň kontrolu: {group.missingDays.map(d=>d.split('-').reverse().join('.')).join(', ')}</p>}<ul>{group.exposures.map((e,i)=><li key={i}>{e.day.split('-').reverse().join('.')} · {e.category} · {e.amounts.join(' + ')}</li>)}</ul></details>)}</div></td></tr>}</Fragment>)}
    </tbody></table></section></>}
  </main>
}
