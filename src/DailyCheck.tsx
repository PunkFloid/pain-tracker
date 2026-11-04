import { useEffect, useRef, useState } from 'react'
import type { Pain } from './db'
import type { MealSlot } from './food-parser.mjs'
import { assessCheck, previousDay } from './day-check-logic.mjs'
import type { DayCheckRecord, HeadacheChoice, FoodChoice } from './day-check-logic.mjs'
import { readCheck, readFoodForChecks, saveCheck } from './day-check-store'
import './DailyCheck.css'
const labels:Record<string,string>={unconfirmed:'Nepotvrzeno',conflict:'Rozpor s epizodou',review:'Znovu potvrdit','confirmed-free':'Bez bolesti','recorded-pain':'Bolest zaznamenaná','needs-episode':'Chybí epizoda',incomplete:'Neúplný',complete:'Kompletní'}
export default function DailyCheck({pains}:{pains:Pain[]}){
  const [day,setDay]=useState(()=>previousDay());const [record,setRecord]=useState<DayCheckRecord|null>(null);const [slots,setSlots]=useState<MealSlot[]>([])
  const [headache,setHeadache]=useState<HeadacheChoice>('unknown');const [food,setFood]=useState<FoodChoice>('unknown')
  const [loading,setLoading]=useState(true);const [loaded,setLoaded]=useState(false);const [reload,setReload]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const lock=useRef(false)
  useEffect(()=>{let alive=true;setLoading(true);setLoaded(false);setRecord(null);setSlots([]);setError('');setNotice('')
    Promise.all([readCheck(day),readFoodForChecks()]).then(([r,s])=>{if(alive){setRecord(r);setSlots(s);setHeadache(r?.headache??'unknown');setFood(r?.food??'unknown');setLoaded(true)}}).catch(e=>{if(alive)setError(String(e))}).finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[day,reload])
  const status=assessCheck(day,record,pains,slots,Intl.DateTimeFormat().resolvedOptions().timeZone)
  async function submit(){if(lock.current||loading||!loaded)return;lock.current=true;setBusy(true);setError('');setNotice('');try{const r=await saveCheck(day,headache,food,record?.revision??null);setRecord(r.record);setSlots(r.slots);setNotice('Uloženo.')}catch(e){setError(e instanceof Error?e.message:String(e))}finally{lock.current=false;setBusy(false)}}
  return <section className="card day-check"><h2>Kontrola dne</h2><label>Datum<input type="date" max={previousDay()} value={day} disabled={busy} onChange={e=>{if(e.target.value)setDay(e.target.value)}}/></label>
    {loading?<p>Načítám…</p>:!loaded?<button onClick={()=>setReload(n=>n+1)}>Načíst znovu</button>:<>
    {record&&<p className="day-check-status">{labels[status.headache]} · Jídelníček: {labels[status.food]}</p>}
    <label>Bolest hlavy<select value={headache} disabled={busy} onChange={e=>{setHeadache(e.target.value as HeadacheChoice);setNotice('')}}><option value="unknown">Nevím / nepotvrzeno</option><option value="none" disabled={status.painCount>0}>Bez bolesti celý den</option><option value="pain">Bolest během dne</option></select></label>
    <label>Jídelníček<select value={food} disabled={busy} onChange={e=>{setFood(e.target.value as FoodChoice);setNotice('')}}><option value="unknown">Nepotvrzeno</option><option value="incomplete">Neúplný</option><option value="complete">Vše, co jsem konzumoval, je zapsané</option></select></label>
    {food==='complete'&&!slots.some(s=>s.day===day&&s.items.length>0)&&<p className="alert">Den je bez potravinových položek. Potvrď jen pokud je to správně.</p>}
    {headache==='pain'&&!status.painCount&&<p className="alert">Doplň také epizodu bolesti.</p>}
    {(status.headache==='conflict'||status.headache==='review'||status.food==='review')&&<p className="alert">Změněné nebo rozporné údaje. Zkontroluj je a ulož znovu.</p>}
    <button className="primary" disabled={busy} onClick={()=>void submit()}>{busy?'Ukládám…':'Uložit'}</button></>}
    {error&&<p className="alert" role="alert">{error}</p>}{notice&&<p className="status" role="status">{notice}</p>}
  </section>
}
