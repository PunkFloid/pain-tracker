import type { MealSlot, FoodItem, Ingredient } from './food-parser.mjs'
export type IngredientRule={mode:'manual'|'off';names:string[];updatedAt?:string}
export type IngredientRules={version:1;items:Record<string,IngredientRule>}
export type ResolvedIngredients={source:'pdf'|'manual'|'off'|'automatic';ingredients:(Ingredient&{originName:string;originFood:string;ingredientSource:string})[]}
export const INGREDIENT_RULES_VERSION:number
export function ingredientKey(name:string):string
export function generalIngredient(name:string):string|null
export function automaticIngredients(name:string):string[]
export function readIngredientRules(storage?:Pick<Storage,'getItem'>):IngredientRules
export function writeIngredientRule(name:string,mode:'auto'|'manual'|'off',names?:string[],storage?:Pick<Storage,'getItem'|'setItem'>):IngredientRules
export function resolveIngredients(item:FoodItem,rules?:IngredientRules):ResolvedIngredients
export function ingredientSlots(slots:MealSlot[],rules?:IngredientRules):MealSlot[]
