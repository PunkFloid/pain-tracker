import type { Pain } from './db'
import type { MealSlot } from './food-parser.mjs'
export const HEADACHE_START:'2026-10-29'
export type HeadacheChoice='auto'|'none'|'pain'|'unknown'
export type FoodChoice='auto'|'complete'|'incomplete'|'unknown'
export type DayCheckRecord={version:1|2;day:string;headache:HeadacheChoice;food:FoodChoice;foodSignature:string;zone:string;updatedAt:string;revision:string}
export type DayAssessment={headache:'unconfirmed'|'confirmed-free'|'assumed-free'|'recorded-pain'|'needs-episode';food:'unconfirmed'|'incomplete'|'complete';painCount:number}
export function localDay(now?:Date):string
export function previousDay(now?:Date):string
export function dayBounds(day:string):{start:number;end:number}
export function painsInDay(day:string,pains:Pain[]):Pain[]
export function foodSnapshot(day:string,slots:MealSlot[]):{available:boolean;signature:string}
export function checkModes(check:DayCheckRecord|null):{headache:HeadacheChoice;food:FoodChoice}
export function validateCheck(check:Pick<DayCheckRecord,'day'|'headache'|'food'>,pains:Pain[],slots:MealSlot[],now?:Date):string[]
export function assessCheck(day:string,check:DayCheckRecord|null,pains:Pain[],slots:MealSlot[],zone:string,now?:Date):DayAssessment
