import { useEffect, useState } from 'react'
import type { MealSlot } from './food-parser.mjs'
import { readFoodForChecks } from './day-check-store'
import { windowReport } from './time-analysis.mjs'
export default function EpisodeFoods({start}:{start:string}){
  const [slots,setSlots]=useState<MealSlot[]|null>(null)
  useEffect(()=>{let alive=true;readFoodForChecks().then(s=>{if(alive)setSlots(s)}).catch(()=>{if(alive)setSlots([])});return()=>{alive=false}},[])
  if(!slots)return <p>Načítám…</p>
  const parts=[['0–24 h',windowReport(slots,start,24,0)],['24–48 h',windowReport(slots,start,48,24)]] as const
  const items=parts.flatMap(([label,r])=>r.rows.flatMap(row=>row.slot.items.map(i=>({label,name:i.name,day:row.slot.day,cat:row.slot.category}))))
  if(!items.length)return null
  return <details><summary>Jídla před bolestí ({items.length})</summary><ul>{items.map((x,i)=><li key={i}>{x.label} · {x.name} · {x.day.split('-').reverse().join('.')} {x.cat}</li>)}</ul></details>
}
