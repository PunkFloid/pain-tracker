import { resolveIngredients } from './ingredient-resolution.mjs'
import { ingredientKey } from './ingredient-rules.mjs'
export function buildFoodContext(slots, rules) {
  const ingredients = new Map(), unresolved = new Map(), disabled = new Map()
  for (const slot of slots) for (const [index, item] of slot.items.entries()) {
    const result = resolveIngredients(item, rules)
    const occurrence = { key: JSON.stringify([slot.key,index]), slotKey: slot.key, day: slot.day, category: slot.category, food: item.name, amount: item.amount }
    if (!result.ingredients.length) {
      const map = result.source === 'off' ? disabled : unresolved
      const key = ingredientKey(item.name)
      if (!map.has(key)) map.set(key, { key, name: item.name, occurrences: [] })
      map.get(key).occurrences.push(occurrence)
    }
    for (const ingredient of result.ingredients) {
      if (!ingredient.ingredientId) continue
      if (!ingredients.has(ingredient.ingredientId)) ingredients.set(ingredient.ingredientId, { id: ingredient.ingredientId, name: ingredient.name, occurrences: new Map() })
      const entry = ingredients.get(ingredient.ingredientId)
      if (!entry.occurrences.has(occurrence.key)) entry.occurrences.set(occurrence.key, { ...occurrence, evidence: new Set(), originalNames: new Set() })
      const source = entry.occurrences.get(occurrence.key)
      source.evidence.add(ingredient.evidence)
      source.originalNames.add(ingredient.originName)
    }
  }
  return {
    ingredients: [...ingredients.values()].map(e => ({ ...e, occurrences: [...e.occurrences.values()].map(o => ({ ...o, evidence: [...o.evidence], originalNames: [...o.originalNames] })) })).sort((a,b)=>a.name.localeCompare(b.name,'cs')),
    unresolved: [...unresolved.values()].sort((a,b)=>a.name.localeCompare(b.name,'cs')),
    disabled: [...disabled.values()].sort((a,b)=>a.name.localeCompare(b.name,'cs'))
  }
}
