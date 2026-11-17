import { useState } from 'react'
import { loadFollowUp } from './follow-up-store'
import { readNamingRules } from './naming-store'
import { mealTimes } from './food-parser.mjs'
import { HEADACHE_START } from './day-check-logic.mjs'
import { readFoodReviews, parseDeferred } from './food-review.mjs'
import { readSuggestionDecisions, FOOD_RULES } from './food-suggestions.mjs'
import { readIngredientRules, INGREDIENT_RULES_VERSION } from './ingredient-rules.mjs'
export default function ExportData(){
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [download,setDownload]=useState<{url:string;name:string}|null>(null)
  async function prepare(){
    if(busy)return
    setBusy(true);setError('')
    try{
      const [records,namingRules]=await Promise.all([loadFollowUp(),readNamingRules()])
      const deferred=parseDeferred(localStorage.getItem('pain-tracker-deferred'))
      const foodReviews=readFoodReviews(),foodSuggestionDecisions=readSuggestionDecisions(),ingredientRules=readIngredientRules()
      const exportedAt=new Date().toISOString()
      const payload={app:'Pain Tracker',exportType:'analysis',schemaVersion:1,exportedAt,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,data:records.data,food:{slots:records.slots},checks:records.checks,namingRules,deferred,foodReviews,foodSuggestionDecisions,ingredientRules,policy:{headacheStart:HEADACHE_START,mealTimes,followUpHours:48,mergeConsumptions:false,foodPainPolicy:'medicated-episodes-only',untreatedPainInFoodAnalysis:'free',ongoingUntreatedPain:'pending',foodSuggestions:FOOD_RULES,ingredientRulesVersion:INGREDIENT_RULES_VERSION}}
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
      if(download)URL.revokeObjectURL(download.url)
      setDownload({url,name:`pain-tracker-analysis-${exportedAt.slice(0,10)}.json`})
    }catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  }
  return <div aria-label="Export dat"><button type="button" disabled={busy} onClick={()=>void prepare()}>{busy?'Připravuji export…':'Export pro analýzu'}</button>{download&&<p><a href={download.url} download={download.name}>Stáhnout JSON</a></p>}{error&&<p role="alert" className="alert">{error}</p>}</div>
}
