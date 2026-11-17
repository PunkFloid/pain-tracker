import type { MealSlot } from './food-parser.mjs'
import type { IngredientRules } from './ingredient-rules.mjs'
export type FoodOccurrence = { key: string; slotKey: string; day: string; category: string; food: string; amount: string }
export type IngredientContext = { id: string; name: string; occurrences: (FoodOccurrence & { evidence: string[]; originalNames: string[] })[] }
export type UnresolvedFood = { key: string; name: string; occurrences: FoodOccurrence[] }
export type FoodContext = { ingredients: IngredientContext[]; unresolved: UnresolvedFood[]; disabled: UnresolvedFood[] }
export function buildFoodContext(slots: MealSlot[], rules?: IngredientRules): FoodContext
