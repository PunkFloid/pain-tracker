import { useState } from 'react'
import FollowUp from './FollowUp'
import FoodSuggestions from './FoodSuggestions'
import IngredientRules from './IngredientRules'
import './compact.css'
export default function StatisticsPage(){
  const [revision,setRevision]=useState(0)
  return <><h1 className="stats-title">Food Tracker</h1><IngredientRules onChanged={()=>setRevision(n=>n+1)}/><FoodSuggestions key={'suggestions-'+revision} onApplied={()=>setRevision(n=>n+1)}/><FollowUp key={revision}/></>
}
