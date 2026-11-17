import type { MealSlot, FoodItem, Ingredient } from './food-parser.mjs'
import type { IngredientRules } from './ingredient-rules.mjs'
export type ResolvedIngredient = Ingredient & { originName: string; originFood: string; ingredientSource: string; ingredientId: string | null; evidence: 'manual' | 'source' | 'inferred' }
export type IngredientResolution = { source: 'pdf' | 'manual' | 'off' | 'automatic'; completeness: 'partial' | 'unknown'; ingredients: ResolvedIngredient[]; originalIngredients: Ingredient[] }
export function resolveIngredients(item: FoodItem, rules?: IngredientRules): IngredientResolution
export function ingredientSlots(slots: MealSlot[], rules?: IngredientRules): MealSlot[]
