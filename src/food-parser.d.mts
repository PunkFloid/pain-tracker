export type Tracking={version:1;id:string;label:string}
export type Ingredient = { name:string; amount:string; tracking?:Tracking }
export type FoodItem = Ingredient & { kcal:number; ingredients:Ingredient[] }
export type MealSlot = { key:string; day:string; category:string; items:FoodItem[]; expected:number|null; namingVersion?:1 }
export const mealTimes: Record<string,[string,string]>
export function signature(slot:MealSlot):string
export function tags(name:string):string[]
export function parseLines(lines:string[]):{slots:MealSlot[];warnings:string[]}
