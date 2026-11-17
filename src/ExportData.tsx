import { useState } from 'react'
import { loadFollowUp } from './follow-up-store'
import { readNamingRules } from './naming-store'
import { mealTimes } from './food-parser.mjs'
import { HEADACHE_START } from './day-check-logic.mjs'
export default function ExportData(){
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [download,setDownload]=useState<{url:string;name:string}|null>(null)
  async function prepare(){
    if(busy)return
    setBusy(true);setError('')
    try{
      const [records,namingRules]=await Promise.all([loadFollowUp(),readNamingRules()])
      const raw=localStorage.getItem('pain-tracker-deferred')
      const deferred:unknown=raw===null?[]:JSON.parse(raw)
      if(!Array.isArray(deferred)||!deferred.every(x=>typeof x==='string'))throw new Error('Neplatný seznam odložených jídel.')
      const exportedAt=new Date().toISOString()
      const payload={app:'Pain Tracker',exportType:'analysis',schemaVersion:1,exportedAt,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,data:records.data,food:{slots:records.slots},checks:records.checks,namingRules,deferred,policy:{headacheStart:HEADACHE_START,mealTimes,followUpHours:48,mergeConsumptions:false}}
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
      if(download)URL.revokeObjectURL(download.url)
      setDownload({url,name:`pain-tracker-analysis-${exportedAt.slice(0,10)}.json`})
    }catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }
  return <section style={{maxWidth:600,margin:'12px auto',padding:'0 20px'}} aria-label="Export dat"><button type="button" disabled={busy} onClick={()=>void prepare()}>{busy?'Připravuji export…':'Export pro analýzu'}</button>{download&&<p><a href={download.url} download={download.name}>Stáhnout JSON</a></p>}{error&&<p role="alert" className="alert">{error}</p>}</section>
}
