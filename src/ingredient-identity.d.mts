export const INGREDIENT_IDENTITY_VERSION: number
export type CanonicalIngredient = { id: string; name: string; matched: boolean }
export function normalizeIngredientName(name: string): string
export function canonicalIngredient(name: string): CanonicalIngredient | null
