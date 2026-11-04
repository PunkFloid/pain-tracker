import type { Pain } from './db'
import type { MealSlot } from './food-parser.mjs'
export type HeadacheChoice='none'|'pain'|'unknown'
export type FoodChoice='complete'|'incomplete'|'unknown'
export type DayCheckRecord={version:1;day:string;headache:HeadacheChoice;food:FoodChoice;foodSignature:string;zone:string;updatedAt:string;revision:string}
export type DayAssessment={headache:'unconfirmed'|'conflict'|'review'|'confirmed-free'|'recorded-pain'|'needs-episode';food:'unconfirmed'|'incomplete'|'review'|'complete';painCount:number}
export function localDay(now?:Date):string
export function previousDay(now?:Date):string
export function dayBounds(day:string):{start:number;end:number}
export function painsInDay(day:string,pains:Pain[]):Pain[]
export function foodSnapshot(day:string,slots:MealSlot[]):{available:boolean;signature:string}
export function validateCheck(check:Pick<DayCheckRecord,'day'|'headache'|'food'>,pains:Pain[],slots:MealSlot[],now?:Date):string[]
export function assessCheck(day:string,check:DayCheckRecord|null,pains:Pain[],slots:MealSlot[],zone:string,now?:Date):DayAssessment
