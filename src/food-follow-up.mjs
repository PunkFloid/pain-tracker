import { followUp } from './follow-up.mjs'
import { painMedicationStatus } from './pain-medication.mjs'
export function foodFollowUp(slots,pains,checks,medications,kind='food',zone=Intl.DateTimeFormat().resolvedOptions().timeZone,now=Date.now()){
  return followUp(slots,pains,checks,kind,zone,now,false,medications)
}
export function foodPainState(pain,medications,now){return painMedicationStatus(pain,medications,now)}
