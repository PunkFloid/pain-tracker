import type { MealSlot, FoodItem, Ingredient } from './food-parser.mjs'
import type { IngredientRules } from './ingredient-rules.mjs'
import type { AiIngredientCache } from './ai-ingredient-cache.mjs'
export type IngredientEvidence = 'manual' | 'source' | 'inferred'
export type IngredientProvenance = { path: string[]; evidence: IngredientEvidence }
export type ResolvedIngredient = Ingredient & { originName: string; originFood: string; ingredientSource: string; ingredientId: string | null; evidence: IngredientEvidence; provenancePaths: IngredientProvenance[] }
export type IngredientResolution = { source: 'pdf' | 'manual' | 'off' | 'automatic' | 'ai'; completeness: 'partial' | 'unknown'; ingredients: ResolvedIngredient[]; originalIngredients: Ingredient[]; warnings: string[] }
export function resolveIngredients(item: FoodItem, rules?: IngredientRules, aiCache?: AiIngredientCache): IngredientResolution
export function ingredientSlots(slots: MealSlot[], rules?: IngredientRules): MealSlot[]
