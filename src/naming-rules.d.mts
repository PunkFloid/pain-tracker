import type { Ingredient, MealSlot } from './food-parser.mjs'
export type NamingRule={id:string;source:string;target:string}
export function normalizeName(s:string):string
export function trackedIdentity(item:Pick<Ingredient,'name'|'tracking'>):{key:string;name:string}
export function prepareNewDays(incoming:MealSlot[],stored:MealSlot[],rules:NamingRule[]):{fresh:MealSlot[];skipped:MealSlot[]}
export function appendNewDays(stored:MealSlot[],incoming:MealSlot[]):{slots:MealSlot[];added:MealSlot[]}
