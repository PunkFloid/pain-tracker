import { useState } from 'react'
import FollowUp from './FollowUp'
import FoodSuggestions from './FoodSuggestions'
import './compact.css'
export default function StatisticsPage(){
  const [revision,setRevision]=useState(0)
  return <><h1 className="stats-title">Food Tracker</h1><FoodSuggestions onApplied={()=>setRevision(n=>n+1)}/><FollowUp key={revision}/></>
}
