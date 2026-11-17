import { useState } from 'react'
import FollowUp from './FollowUp'
import FoodSuggestions from './FoodSuggestions'
import IngredientRules from './IngredientRules'
import ReviewMigration from './ReviewMigration'
import './compact.css'
export default function StatisticsPage(){
  const [revision,setRevision]=useState(0)
  const [kind,setKind]=useState<'food'|'ingredient'>('food')
  const refresh=()=>setRevision(n=>n+1)
  return <><h1 className="stats-title">Food Tracker</h1><div className="stats-subnav" aria-label="Pohled Food Trackeru"><button className={kind==='food'?'primary':''} aria-pressed={kind==='food'} onClick={()=>setKind('food')}>Jídla</button><button className={kind==='ingredient'?'primary':''} aria-pressed={kind==='ingredient'} onClick={()=>setKind('ingredient')}>Suroviny</button></div><IngredientRules onChanged={refresh}/><ReviewMigration revision={revision} onChanged={refresh}/><FoodSuggestions kind={kind} revision={revision} onApplied={refresh}/><FollowUp key={kind} kind={kind} revision={revision}/></>
}
