import { useEffect, useRef, useState } from 'react'
import type { Pain } from './db'
import type { MealSlot } from './food-parser.mjs'
import { assessCheck, checkModes, localDay } from './day-check-logic.mjs'
import type { DayCheckRecord, HeadacheChoice, FoodChoice } from './day-check-logic.mjs'
import { readCheck, readFoodForChecks, saveCheck } from './day-check-store'
import './DailyCheck.css'
const labels:Record<string,string>={unconfirmed:'Bez záznamu','confirmed-free':'Bez bolesti','assumed-free':'Bez bolesti','recorded-pain':'Bolest','needs-episode':'Bolest – chybí epizoda',incomplete:'Neúplný',complete:'Kompletní'}
export default function DailyCheck({pains}:{pains:Pain[]}){
  const [day,setDay]=useState(()=>localDay());const [record,setRecord]=useState<DayCheckRecord|null>(null);const [slots,setSlots]=useState<MealSlot[]>([])
  const [headache,setHeadache]=useState<HeadacheChoice>('auto');const [food,setFood]=useState<FoodChoice>('auto')
  const [loading,setLoading]=useState(true);const [loaded,setLoaded]=useState(false);const [reload,setReload]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const lock=useRef(false)
  useEffect(()=>{let alive=true;setLoading(true);setLoaded(false);setRecord(null);setSlots([]);setError('');setNotice('')
    Promise.all([readCheck(day),readFoodForChecks()]).then(([r,s])=>{if(alive){const modes=checkModes(r);setRecord(r);setSlots(s);setHeadache(modes.headache);setFood(modes.food);setLoaded(true)}}).catch(e=>{if(alive)setError(String(e))}).finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[day,reload])
  const status=assessCheck(day,record,pains,slots,Intl.DateTimeFormat().resolvedOptions().timeZone)
  async function submit(){if(lock.current||loading||!loaded)return;lock.current=true;setBusy(true);setError('');setNotice('');try{const r=await saveCheck(day,headache,food,record?.revision??null);setRecord(r.record);setSlots(r.slots);setNotice('Uloženo.')}catch(e){setError(e instanceof Error?e.message:String(e))}finally{lock.current=false;setBusy(false)}}
  return <section className="card day-check"><h2>Stav dne</h2><label>Datum<input type="date" max={localDay()} value={day} disabled={busy} onChange={e=>{if(e.target.value)setDay(e.target.value)}}/></label>
    {loading?<p>Načítám…</p>:!loaded?<button onClick={()=>setReload(n=>n+1)}>Načíst znovu</button>:<>
    <p className="day-check-status">{labels[status.headache]} · Jídelníček: {labels[status.food]}</p>
    <label>Bolest hlavy<select value={headache} disabled={busy} onChange={e=>{setHeadache(e.target.value as HeadacheChoice);setNotice('')}}><option value="auto">Automaticky</option><option value="none" disabled={status.painCount>0}>Bez bolesti</option><option value="pain">Bolest během dne</option><option value="unknown">Bez záznamu / nevím</option></select></label>
    <label>Jídelníček<select value={food} disabled={busy} onChange={e=>{setFood(e.target.value as FoodChoice);setNotice('')}}><option value="auto">Automaticky podle importu</option><option value="complete">Kompletní</option><option value="incomplete">Neúplný</option><option value="unknown">Bez záznamu / nevím</option></select></label>
    {headache==='pain'&&!status.painCount&&<p className="alert">Doplň také epizodu bolesti.</p>}
    <button className="primary" disabled={busy} onClick={()=>void submit()}>{busy?'Ukládám…':'Uložit výjimku'}</button></>}
    {error&&<p className="alert" role="alert">{error}</p>}{notice&&<p className="status" role="status">{notice}</p>}
  </section>
}
