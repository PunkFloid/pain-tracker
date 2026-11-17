import { followUp } from './follow-up.mjs'
import { painMedicationStatus } from './pain-medication.mjs'
import { mealTimes } from './food-parser.mjs'
import { assessCheck, checkModes, HEADACHE_START, localDay } from './day-check-logic.mjs'
import { readIngredientRules } from './ingredient-rules.mjs'
import { ingredientSlots } from './ingredient-resolution.mjs'
import { filterIngredientEvidence, readIncludeInferred } from './ingredient-evidence.mjs'
export function foodFollowUp(slots,pains,checks,medications,kind='food',zone=Intl.DateTimeFormat().resolvedOptions().timeZone,now=Date.now()){
  const byDay=new Map(checks.map(c=>[c.day,c])),known=new Map()
  function hasHeadacheData(day){
    if(known.has(day))return known.get(day)
    const check=byDay.get(day)??null,mode=checkModes(check).headache
    const result=mode!=='unknown'&&!(mode==='auto'&&day<HEADACHE_START)&&['confirmed-free','assumed-free','recorded-pain'].includes(assessCheck(day,check,pains,slots,zone,new Date(now)).headache)
    known.set(day,result);return result
  }
  const eligible=slots.filter(slot=>{
    const times=mealTimes[slot.category]
    if(!times||!hasHeadacheData(slot.day))return false
    const from=new Date(`${slot.day}T${times[0]}:00`).getTime(),mealEnd=new Date(`${slot.day}T${times[1]}:00`).getTime()
    if(!Number.isFinite(from)||!Number.isFinite(mealEnd)||mealEnd<from||from>now)return false
    const until=Math.min(mealEnd+48*3600000,now),day=new Date(from)
    day.setHours(0,0,0,0)
    while(day.getTime()<until){if(!hasHeadacheData(localDay(day)))return false;day.setDate(day.getDate()+1)}
    return true
  })
  const analysis=kind==='ingredient'?filterIngredientEvidence(ingredientSlots(eligible,readIngredientRules()),readIncludeInferred()):eligible
  return followUp(analysis,pains,checks,kind,zone,now,false,medications)
}
export function foodPainState(pain,medications,now){return painMedicationStatus(pain,medications,now)}
