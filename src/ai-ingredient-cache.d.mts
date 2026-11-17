import type { AiIngredientRequest, AiIngredientProposal } from './ai-ingredients.mjs'
import type { FoodItem } from './food-parser.mjs'
import type { IngredientRules } from './ingredient-rules.mjs'
export type AiIngredientCache = { version: 1; items: Record<string,{ request: AiIngredientRequest; response: {version:1;foodKey:string;ingredients:{name:string;basis:'named'|'typical'}[];needsReview:boolean}; createdAt:string }> }
export function readAiIngredientCache(storage?: Pick<Storage,'getItem'>): AiIngredientCache
export function saveAiIngredientProposal(request: AiIngredientRequest, input: unknown, storage?: Pick<Storage,'getItem'|'setItem'>, now?: string): AiIngredientProposal
export function cachedAiIngredientProposal(item: {name:string;ingredients?:{name:string}[]}, cache: AiIngredientCache): AiIngredientProposal | null
export function selectAiIngredientFallback(item: FoodItem, rules: IngredientRules, cache: AiIngredientCache): AiIngredientProposal | null
