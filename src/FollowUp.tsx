import { Fragment, useEffect, useMemo, useState } from 'react'
import type { FollowRow, FollowStatus } from './follow-up.mjs'
import type { Pain } from './db'
import { loadFollowUp, foodFollowUp } from './follow-up-store'
import { readFoodReviews, writeFoodReview, parseDeferred, episodeIds } from './food-review.mjs'
import type { FoodStatus, FoodReview, FoodReviews } from './food-review.mjs'
import './food-tracker.css'
type Sort='name'|'count'|'episodes'
const groups:[FoodStatus,string][]=[['watch','Sleduji'],['ok','Běžně OK'],['suspect','Podezřelé']]
const labels:Record<FollowStatus,string>={free:'Bez bolesti',pain:'Bolest s lékem',running:'Běží',unknown:'Chybí údaje'}
const date=(s:string)=>new Date(s).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
function FoodDetail({row,review,pains,save}:{row:FollowRow;review?:FoodReview;pains:Pain[];save:(patch:{status?:FoodStatus;note?:string})=>boolean}){
  const [note,setNote]=useState(review?.note??'')
  const ids=episodeIds(row)
  return <div className="detail-content tracker-detail"><h3>{row.name}</h3><p>{row.occasions} konzumací · {row.free} bez bolesti · {row.running+row.unknown} čeká</p><div className="tracker-actions">{groups.map(([status,label])=><button key={status} aria-pressed={review?.status===status||(!review?.status&&status==='watch')} onClick={()=>save({status,note})}>{label}</button>)}</div><label>Poznámka<textarea maxLength={2000} rows={2} value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={note===(review?.note??'')} onClick={()=>save({note})}>Uložit poznámku</button><details><summary>Epizody ({ids.length})</summary>{ids.length?<ul>{ids.map(id=>{const pain=pains.find(p=>p.id===id);return <li key={id}>{pain?`${date(pain.start)} · ${pain.intensity}/10`:id}</li>})}</ul>:<p>Žádné sledované epizody.</p>}</details><details><summary>Konzumace ({row.occasions})</summary><ul>{[...row.groups].reverse().flatMap(g=>g.exposures.map(e=>({g,e}))).map(({g,e},i)=><li key={i}>{labels[g.status]} · {e.day.split('-').reverse().join('.')} · {e.category} · {e.amounts.join(' + ')}</li>)}</ul></details></div>
}
export default function FollowUp({kind,revision=0}:{kind:'food'|'ingredient';revision?:number}){
  const [loaded,setLoaded]=useState<Awaited<ReturnType<typeof loadFollowUp>>|null>(null)
  const [reviews,setReviews]=useState<FoodReviews>({version:1,items:{}}),[legacy,setLegacy]=useState<string[]>([])
  const [error,setError]=useState(''),[search,setSearch]=useState(''),[open,setOpen]=useState(''),[now,setNow]=useState(()=>Date.now())
  const [group,setGroup]=useState<FoodStatus>('watch'),[sort,setSort]=useState<Sort>('count'),[desc,setDesc]=useState(true),[all,setAll]=useState(false)
  useEffect(()=>{let alive=true;loadFollowUp().then(d=>{if(alive){const r=readFoodReviews(),l=parseDeferred(localStorage.getItem('pain-tracker-deferred'));setReviews(r);setLegacy(l);setLoaded(d);setError('')}}).catch(e=>{if(alive)setError(String(e))});const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{alive=false;clearInterval(timer)}},[revision])
  const rows=useMemo(()=>loaded?foodFollowUp(loaded.slots,loaded.data.pains,loaded.checks,loaded.data.medications,kind,Intl.DateTimeFormat().resolvedOptions().timeZone,now):[],[loaded,kind,now])
  const id=(r:FollowRow)=>kind+'|'+r.key
  const parked=(r:FollowRow)=>legacy.includes(id(r))&&!reviews.items[id(r)]?.status
  const status=(r:FollowRow)=>reviews.items[id(r)]?.status??'watch'
  const query=search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ')
  const visible=rows.filter(r=>r.name.normalize('NFC').toLocaleLowerCase('cs-CZ').includes(query))
  const order=(a:FollowRow,b:FollowRow)=>{const n=sort==='name'?a.name.localeCompare(b.name,'cs'):sort==='count'?a.occasions-b.occasions:episodeIds(a).length-episodeIds(b).length;return (desc?-n:n)||a.name.localeCompare(b.name,'cs')}
  const active=visible.filter(r=>!parked(r)&&status(r)===group).sort(order),old=visible.filter(parked).sort(order)
  const nameLabel=kind==='food'?'Jídlo':'Surovina'
  function pick(k:Sort){if(k===sort)setDesc(!desc);else{setSort(k);setDesc(k!=='name')}setAll(false)}
  function save(key:string,patch:{status?:FoodStatus;note?:string}){try{const next=writeFoodReview(key,patch);setReviews(next);setError('');return true}catch(e){setError(e instanceof Error?e.message:String(e));return false}}
  const line=(r:FollowRow)=><Fragment key={r.key}><tr className={open===id(r)?'is-open':''}><td><button className="row-toggle" aria-expanded={open===id(r)} onClick={()=>setOpen(open===id(r)?'':id(r))}><span className="item-name">{r.name}</span></button></td><td>{r.occasions}</td><td>{episodeIds(r).length}</td></tr>{open===id(r)&&<tr className="detail-row"><td colSpan={3}><FoodDetail key={id(r)} row={r} review={reviews.items[id(r)]} pains={loaded?.data.pains??[]} save={patch=>save(id(r),patch)}/></td></tr>}</Fragment>
  return <main className="app food compact-view food-tracker" aria-label={kind==='food'?'Food Tracker — Jídla':'Food Tracker — Suroviny'}>{error&&<p className="alert" role="alert">{error}</p>}{!loaded?<p>{error?'Načtení selhalo. Obnov stránku.':'Načítám…'}</p>:<><div className="tracker-tabs" aria-label="Skupina položek">{groups.map(([key,label])=><button key={key} aria-pressed={group===key} className={group===key?'primary':''} onClick={()=>{setGroup(key);setAll(false);setOpen('')}}>{label} <span>({rows.filter(r=>!parked(r)&&status(r)===key).length})</span></button>)}</div><section className="card"><input className="compact-input" type="search" aria-label="Hledat v této skupině" placeholder="Hledat v této skupině" value={search} onChange={e=>{setSearch(e.target.value);setAll(false)}}/></section><section className="card table-card"><table className="data-table"><thead><tr>{([['name',nameLabel],['count','Konzumace'],['episodes','Epizody']] as [Sort,string][]).map(([key,label])=><th key={key} scope="col" aria-sort={sort===key?(desc?'descending':'ascending'):'none'}><button className={sort===key?'primary':''} onClick={()=>pick(key)}>{label}{sort===key?(desc?' ↓':' ↑'):''}</button></th>)}</tr></thead><tbody>{!active.length&&<tr><td colSpan={3}>Žádné položky.</td></tr>}{(all?active:active.slice(0,10)).map(line)}</tbody></table>{active.length>10&&<button onClick={()=>setAll(!all)}>{all?'Zobrazit méně':`Zobrazit zbytek (${active.length-10})`}</button>}</section>{old.length>0&&<section className="card table-card"><details><summary>Dříve odložené ({old.length})</summary><table className="data-table"><thead><tr><th>{nameLabel}</th><th>Konzumace</th><th>Epizody</th></tr></thead><tbody>{old.map(line)}</tbody></table></details></section>}</>}</main>
}
