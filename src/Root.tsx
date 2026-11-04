import { useState } from 'react'
import App from './App'
import Food from './Food'
import Statistics from './StatisticsPage'
import './food.css'
export default function Root(){
  const [tab,setTab]=useState('pain')
  return <><div className="module-switch" aria-label="Část aplikace" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>
    <button className={tab==='pain'?'selected':''} aria-pressed={tab==='pain'} onClick={()=>setTab('pain')}>Bolesti a léky</button>
    <button className={tab==='food'?'selected':''} aria-pressed={tab==='food'} onClick={()=>setTab('food')}>Jídelníček</button>
    <button className={tab==='statistics'?'selected':''} aria-pressed={tab==='statistics'} onClick={()=>setTab('statistics')}>Statistiky</button>
  </div><div hidden={tab!=='pain'}><App visible={tab==='pain'}/></div><div hidden={tab!=='food'}><Food/></div>{tab==='statistics'&&<Statistics/>}</>
}
