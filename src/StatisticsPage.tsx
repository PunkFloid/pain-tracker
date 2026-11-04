import { useState } from 'react'
import Statistics from './Statistics'
import FollowUp from './FollowUp'
import './compact.css'
export default function StatisticsPage(){
  const [mode,setMode]=useState('before')
  return <><div className="stats-subnav" aria-label="Přehled statistik"><button className={mode==='before'?'primary':''} aria-pressed={mode==='before'} onClick={()=>setMode('before')}>Před bolestí</button><button className={mode==='after'?'primary':''} aria-pressed={mode==='after'} onClick={()=>setMode('after')}>Po jídle</button></div>{mode==='before'?<Statistics/>:<FollowUp/>}</>
}
