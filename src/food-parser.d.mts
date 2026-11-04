export type Ingredient = { name:string; amount:string }
export type FoodItem = Ingredient & { kcal:number; ingredients:Ingredient[] }
export type MealSlot = { key:string; day:string; category:string; items:FoodItem[]; expected:number|null }
export const mealTimes: Record<string,[string,string]>
export function signature(slot:MealSlot):string
export function tags(name:string):string[]
export function parseLines(lines:string[]):{slots:MealSlot[];warnings:string[]}
