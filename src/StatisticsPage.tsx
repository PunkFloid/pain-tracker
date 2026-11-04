import { useState } from 'react'
import Statistics from './Statistics'
import FollowUp from './FollowUp'
import Analysis from './Analysis'
import './compact.css'
export default function StatisticsPage(){
  const [mode,setMode]=useState('before')
  return <><h1 className="stats-title">Statistiky</h1><div className="stats-subnav" aria-label="Přehled statistik">{[['before','Před bolestí'],['after','Po jídle'],['episodes','Epizody']].map(([id,label])=><button key={id} className={mode===id?'primary':''} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div>{mode==='before'?<Statistics/>:mode==='after'?<FollowUp/>:<Analysis/>}</>
}
