import { Fragment, useEffect, useMemo, useState } from 'react'
import { followUp } from './follow-up.mjs'
import type { FollowStatus } from './follow-up.mjs'
import { loadFollowUp } from './follow-up-store'
type Row=ReturnType<typeof followUp>[number]
type SortKey='name'|'count'|'pain'|'free'|'wait'
const storeKey='pain-tracker-deferred'
function readDeferred():string[]{try{const v=JSON.parse(localStorage.getItem(storeKey)??'[]');return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[]}catch{return[]}}
const labels:Record<FollowStatus,string>={free:'Bez bolesti',pain:'Bolest',running:'Běží',unknown:'Chybí údaje'}
const fd=(d:string)=>d.split('-').reverse().join('.')
const value=(r:Row,k:SortKey)=>k==='count'?r.occasions:k==='pain'?r.pain:k==='free'?r.free:r.running+r.unknown
const heads:[SortKey,string,string][]=[['name','Jídlo','Jídlo'],['count','🍴','Snědeno'],['pain','🤕','Bolest'],['free','✅','Bez bolesti'],['wait','⏳','Čeká']]
const headStyle={minHeight:36,padding:'6px 8px',whiteSpace:'nowrap'} as const
export default function FollowUp(){
  const [loaded,setLoaded]=useState<Awaited<ReturnType<typeof loadFollowUp>>|null>(null)
  const [error,setError]=useState('');const [kind,setKind]=useState<'food'|'ingredient'>('food');const [search,setSearch]=useState('');const [open,setOpen]=useState('');const [now,setNow]=useState(()=>Date.now())
  const [sort,setSort]=useState<SortKey>('count');const [desc,setDesc]=useState(true);const [deferred,setDeferred]=useState<string[]>(readDeferred)
  useEffect(()=>{let alive=true;loadFollowUp().then(d=>{if(alive)setLoaded(d)}).catch(e=>{if(alive)setError(String(e))});const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{alive=false;clearInterval(timer)}},[])
  const rows=useMemo(()=>loaded?followUp(loaded.slots,loaded.data.pains,loaded.checks,kind,Intl.DateTimeFormat().resolvedOptions().timeZone,now,false):[],[loaded,kind,now])
  function toggle(id:string){const next=deferred.includes(id)?deferred.filter(x=>x!==id):[...deferred,id];setDeferred(next);try{localStorage.setItem(storeKey,JSON.stringify(next))}catch{setError('Uložení seznamu selhalo.')}}
  function pick(k:SortKey){if(k===sort)setDesc(!desc);else{setSort(k);setDesc(k!=='name')}}
  const query=search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ')
  const id=(r:Row)=>kind+'|'+r.key
  const order=(a:Row,b:Row)=>{const d=sort==='name'?a.name.localeCompare(b.name,'cs'):value(a,sort)-value(b,sort);return (desc?-d:d)||a.name.localeCompare(b.name,'cs')}
  const visible=rows.filter(r=>r.key.includes(query))
  const active=visible.filter(r=>!deferred.includes(id(r))).sort(order)
  const parked=visible.filter(r=>deferred.includes(id(r))).sort(order)
  const detail=(r:Row)=>open===id(r)&&<tr className="detail-row"><td colSpan={5}><div className="detail-content"><ul>{[...r.groups].reverse().flatMap(g=>g.exposures.map(e=>({g,e}))).map(({g,e},i)=><li key={i}>{labels[g.status]} · {fd(e.day)} · {e.category} · {e.amounts.join(' + ')}</li>)}</ul><button onClick={()=>toggle(id(r))}>{deferred.includes(id(r))?'Vrátit':'Odložit'}</button></div></td></tr>
  const line=(r:Row)=><Fragment key={r.key}><tr className={open===id(r)?'is-open':''}><td><button className="row-toggle" aria-expanded={open===id(r)} onClick={()=>setOpen(open===id(r)?'':id(r))}><span className="item-name">{r.name}</span></button></td><td>{r.occasions}</td><td>{r.pain}</td><td>{r.free}</td><td>{r.running+r.unknown}</td></tr>{detail(r)}</Fragment>
  return <main className="app food compact-view" aria-label="Statistiky jídel">{error&&<p className="alert" role="alert">{error}</p>}
    {!loaded?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:<>
    <section className="card"><label>Zobrazit<select value={kind} onChange={e=>{setKind(e.target.value as 'food'|'ingredient');setOpen('')}}><option value="food">Jídla</option><option value="ingredient">Suroviny</option></select></label><input className="compact-input" type="search" aria-label="Hledat" placeholder="Hledat" value={search} onChange={e=>setSearch(e.target.value)}/></section>
    <section className="card table-card"><table className="data-table"><thead><tr>{heads.map(([k,icon,label])=><th key={k} scope="col"><button style={headStyle} className={sort===k?'primary':''} aria-pressed={sort===k} aria-label={label} title={label} onClick={()=>pick(k)}>{icon}{sort===k?(desc?'↓':'↑'):''}</button></th>)}</tr></thead><tbody>
    {!active.length&&<tr><td className="empty-cell" colSpan={5}>Žádné položky.</td></tr>}
    {active.map(line)}
    </tbody></table></section>
    {!!parked.length&&<section className="card table-card"><details><summary>Odložené ({parked.length})</summary><table className="data-table"><tbody>{parked.map(line)}</tbody></table></details></section>}
    </>}
  </main>
}
