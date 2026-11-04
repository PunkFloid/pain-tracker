import { useEffect, useRef, useState } from 'react'
import type { Pain } from './db'
import type { MealSlot } from './food-parser.mjs'
import { assessCheck, previousDay } from './day-check-logic.mjs'
import type { DayCheckRecord, HeadacheChoice, FoodChoice } from './day-check-logic.mjs'
import { readCheck, readFoodForChecks, saveCheck } from './day-check-store'
import './DailyCheck.css'
const labels:Record<string,string>={unconfirmed:'Nepotvrzeno',conflict:'Rozpor s uloženou bolestí – nutná kontrola',review:'Změněné podklady nebo časové pásmo – potvrď znovu','confirmed-free':'Potvrzený celý den bez bolesti','recorded-pain':'Bolest potvrzená a epizoda zaznamenaná','needs-episode':'Bolest potvrzená, ale chybí odpovídající epizoda',incomplete:'Jídelníček označen jako neúplný',complete:'Úplnost jídelníčku potvrzená'}
export default function DailyCheck({pains}:{pains:Pain[]}){
  const [day,setDay]=useState(()=>previousDay())
  const [record,setRecord]=useState<DayCheckRecord|null>(null)
  const [slots,setSlots]=useState<MealSlot[]>([])
  const [headache,setHeadache]=useState<HeadacheChoice>('unknown')
  const [food,setFood]=useState<FoodChoice>('unknown')
  const [loading,setLoading]=useState(true);const [loaded,setLoaded]=useState(false);const [reload,setReload]=useState(0);const [busy,setBusy]=useState(false)
  const [error,setError]=useState('');const [notice,setNotice]=useState('')
  const lock=useRef(false)
  useEffect(()=>{let alive=true;setLoading(true);setLoaded(false);setRecord(null);setSlots([]);setError('');setNotice('')
    Promise.all([readCheck(day),readFoodForChecks()]).then(([r,s])=>{if(alive){setRecord(r);setSlots(s);setHeadache(r?.headache??'unknown');setFood(r?.food??'unknown');setLoaded(true)}}).catch(e=>{if(alive)setError(String(e))}).finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[day,reload])
  const status=assessCheck(day,record,pains,slots,Intl.DateTimeFormat().resolvedOptions().timeZone)
  const hasFood=slots.some(s=>s.day===day&&s.items.length>0)
  async function submit(){
    if(lock.current||loading||!loaded)return
    lock.current=true;setBusy(true);setError('');setNotice('')
    try{const result=await saveCheck(day,headache,food,record?.revision??null);setRecord(result.record);setSlots(result.slots);setNotice('Kontrola dne uložena.')}
    catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{lock.current=false;setBusy(false)}
  }
  return <section className="card day-check"><h2>Kontrola minulého dne</h2><p>Začni včerejškem, nebo vyber starší den. Dnešek lze uzavřít až po jeho skončení.</p>
    <label>Datum<input type="date" max={previousDay()} required value={day} disabled={busy} onChange={e=>{if(e.target.value)setDay(e.target.value)}}/></label>
    {loading?<p>Načítám kontrolu…</p>:!loaded?<button onClick={()=>setReload(n=>n+1)}>Zkusit načíst znovu</button>:<>
    {record&&<div className="day-check-status"><small>POSLEDNÍ ULOŽENÁ KONTROLA · STAV OVĚŘENÝ PROTI AKTUÁLNÍM DATŮM</small><p>Bolest: {labels[status.headache]}<br/>Jídlo: {labels[status.food]}</p><p className="muted">Uloženo: {new Date(record.updatedAt).toLocaleString('cs-CZ')}</p></div>}
    {!record&&<p className="muted">Tento den zatím nebyl potvrzen. Chybějící záznam není potvrzení bezbolestného dne.</p>}
    <p className="muted">Do dne zasahuje {status.painCount} uložených epizod bolesti.</p>
    <label>Průběh bolesti<select value={headache} disabled={busy} onChange={e=>{setHeadache(e.target.value as HeadacheChoice);setNotice('')}}><option value="unknown">Nevím / nemám úplný záznam</option><option value="none" disabled={status.painCount>0}>Bez bolesti celý den</option><option value="pain">Bolest během dne</option></select></label>
    <label>Jídelníček<select value={food} disabled={busy} onChange={e=>{setFood(e.target.value as FoodChoice);setNotice('')}}><option value="unknown">Zatím nepotvrzeno</option><option value="incomplete">Něco z toho, co jsem konzumoval, chybí</option><option value="complete">Vše, co jsem skutečně konzumoval, je zapsané</option></select></label>
    <p className="muted">Počet jídel nehraje roli. Den může být kompletní se třemi, dvěma nebo jediným jídlem. Vynechané chody nemusíš zapisovat ani vytvářet prázdné kategorie. Úplnost potvrzuješ ty; aplikace ji z počtu záznamů neodvozuje.</p>
    {food==='complete'&&!hasFood&&<p className="alert">V tomto dni nejsou importované žádné potravinové položky. Úplnost potvrď jen tehdy, pokud nulový zápis skutečně odpovídá celé tvé konzumaci. Pokud jsi jedl nebo měl zaznamenávané nápoje, nejprve doplň jídelníček.</p>}
    {headache==='pain'&&!status.painCount&&<p className="alert">Bolest můžeš potvrdit, ale doplň také její skutečný začátek a konec pomocí záznamu bolesti nahoře. Denní potvrzení samo epizodu nevytváří.</p>}
    {(status.headache==='conflict'||status.headache==='review'||status.food==='review')&&<p className="alert">Původní potvrzení není pro dotčenou část aktuálně platné. Zkontroluj epizody a jídelníček a ulož opravenou nebo znovu potvrzenou kontrolu. Původní záznamy se nemažou.</p>}
    <button className="primary" disabled={busy} onClick={()=>void submit()}>{busy?'Ukládám…':'Uložit kontrolu dne'}</button>
    </>}
    {error&&<p className="alert" role="alert">{error}</p>}{notice&&<p className="status" role="status">{notice}</p>}
    <p className="muted">Kontroly zatím nemění statistiky ani nevyřazují potraviny ze sledování. Sjednocenou zálohu včetně kontrol a její obnovení doplníme v následujícím kroku; současné exporty bolesti a jídla tyto kontroly neobsahují. Časové pásmo: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
  </section>
}
