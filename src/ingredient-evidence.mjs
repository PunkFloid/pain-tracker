const KEY = 'pain-tracker-ingredient-evidence'
export function readIncludeInferred(storage = typeof localStorage === 'undefined' ? undefined : localStorage) {
  const raw = storage?.getItem(KEY) ?? null
  if (raw === null) return true
  const data = JSON.parse(raw)
  if (data?.version !== 1 || typeof data.includeInferred !== 'boolean') throw new Error('Neplatné nastavení původu surovin.')
  return data.includeInferred
}
export function writeIncludeInferred(value, storage = localStorage) {
  if (typeof value !== 'boolean') throw new TypeError('Nastavení musí být boolean.')
  storage.setItem(KEY, JSON.stringify({ version: 1, includeInferred: value }))
}
export function filterIngredientEvidence(slots, includeInferred = true) {
  if (includeInferred) return slots
  return slots.map(slot => ({ ...slot, items: slot.items.map(item => ({ ...item, ingredients: item.ingredients.filter(i => i.evidence === 'manual' || i.evidence === 'source') })) }))
}
