import type { MealSlot } from './food-parser.mjs'
export type WindowRow = {slot:MealSlot;start:number;end:number;status:'inside'|'possible'}
// expected/imported count calendar days, not meal categories. missing contains ISO dates.
export type WindowReport = {low:number;high:number;rows:WindowRow[];expected:number;imported:number;missing:string[]}
export function relation(start:number,end:number,low:number,high:number):'none'|'inside'|'possible'
export function dayKey(d:Date):string
export function windowReport(slots:MealSlot[],onset:string,olderHours:number,newerHours:number,times?:Record<string,[string,string]>):WindowReport
