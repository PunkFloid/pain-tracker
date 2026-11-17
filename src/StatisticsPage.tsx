import { useState } from 'react'
import FollowUp from './FollowUp'
import FoodSuggestions from './FoodSuggestions'
import IngredientRules from './IngredientRules'
import ReviewMigration from './ReviewMigration'
import FoodContext from './FoodContext'
import IngredientEvidence from './IngredientEvidence'
import AiProposalStatus from './AiProposalStatus'
import './compact.css'
export default function StatisticsPage(){
  const [revision,setRevision]=useState(0)
  const refresh=()=>setRevision(n=>n+1)
  return <><h1 className="stats-title">Food Tracker</h1><div id="food-composition"><IngredientRules onChanged={refresh}/></div><IngredientEvidence revision={revision} onChanged={refresh}/><ReviewMigration revision={revision} onChanged={refresh}/><FoodSuggestions kind="ingredient" revision={revision} onApplied={refresh}/><FollowUp kind="ingredient" revision={revision}/><FoodContext revision={revision}/><AiProposalStatus revision={revision}/></>
}
