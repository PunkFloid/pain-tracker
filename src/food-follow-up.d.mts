import type { MealSlot } from './food-parser.mjs'
import type { Pain, Medication } from './db'
import type { DayCheckRecord } from './day-check-logic.mjs'
import type { FollowRow } from './follow-up.mjs'
export function foodFollowUp(slots:MealSlot[],pains:Pain[],checks:DayCheckRecord[],medications:Medication[],kind?:'food'|'ingredient',zone?:string,now?:number):FollowRow[]
export function foodPainState(pain:Pain,medications:Medication[],now?:number):'treated'|'pending'|'untreated'
