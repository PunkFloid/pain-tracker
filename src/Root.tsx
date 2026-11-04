import { useState } from 'react'
import App from './App'
import Food from './Food'
import Analysis from './Analysis'
import './food.css'
export default function Root(){
  const [tab,setTab]=useState('pain')
  return <><div className="module-switch" aria-label="Část aplikace">
    <button className={tab==='pain'?'selected':''} aria-pressed={tab==='pain'} onClick={()=>setTab('pain')}>Bolesti a léky</button>
    <button className={tab==='food'?'selected':''} aria-pressed={tab==='food'} onClick={()=>setTab('food')}>Jídelníček</button>
    <button className={tab==='analysis'?'selected':''} aria-pressed={tab==='analysis'} onClick={()=>setTab('analysis')}>Souvislosti</button>
  </div><div hidden={tab!=='pain'}><App/></div><div hidden={tab!=='food'}><Food/></div>{tab==='analysis'&&<Analysis/>}</>
}
