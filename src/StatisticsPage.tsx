import { useState } from 'react'
import FollowUp from './FollowUp'
import FoodSuggestions from './FoodSuggestions'
import IngredientRules from './IngredientRules'
import './compact.css'
export default function StatisticsPage(){
  const [revision,setRevision]=useState(0)
  const [kind,setKind]=useState<'food'|'ingredient'>('food')
  return <><h1 className="stats-title">Food Tracker</h1><div className="stats-subnav" aria-label="Pohled Food Trackeru"><button className={kind==='food'?'primary':''} aria-pressed={kind==='food'} onClick={()=>setKind('food')}>Jídla</button><button className={kind==='ingredient'?'primary':''} aria-pressed={kind==='ingredient'} onClick={()=>setKind('ingredient')}>Suroviny</button></div><IngredientRules onChanged={()=>setRevision(n=>n+1)}/><FoodSuggestions kind={kind} revision={revision} onApplied={()=>setRevision(n=>n+1)}/><FollowUp key={kind} kind={kind} revision={revision}/></>
}
