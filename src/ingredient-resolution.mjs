import { resolveIngredients as legacyResolve, ingredientKey } from './ingredient-rules.mjs'
import { canonicalIngredient } from './ingredient-identity.mjs'

export function resolveIngredients(item, rules = { version: 1, items: {} }) {
  const rule = rules.items[ingredientKey(item.name)]
  const overridden = rule?.mode === 'manual' || rule?.mode === 'off'
  const resolved = legacyResolve(overridden ? { ...item, ingredients: [] } : item, rules)
  const evidence = resolved.source === 'manual' ? 'manual' : resolved.source === 'pdf' ? 'source' : 'inferred'
  const ingredients = resolved.ingredients.map(ingredient => {
    const canonical = canonicalIngredient(ingredient.name)
    return { ...ingredient, ingredientId: canonical?.id ?? null, evidence }
  })
  return {
    source: resolved.source,
    completeness: ingredients.length ? 'partial' : 'unknown',
    ingredients,
    originalIngredients: (item.ingredients ?? []).map(ingredient => ({ ...ingredient }))
  }
}

export function ingredientSlots(slots, rules) {
  return slots.map(slot => ({ ...slot, items: slot.items.map(item => {
    const resolved = resolveIngredients(item, rules)
    return { ...item, ingredients: resolved.ingredients }
  }) }))
}
