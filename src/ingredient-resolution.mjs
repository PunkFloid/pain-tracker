import { automaticIngredients, generalIngredient, ingredientKey } from './ingredient-rules.mjs'
import { canonicalIngredient } from './ingredient-identity.mjs'

function composition(item, rules) {
  const rule = rules.items[ingredientKey(item.name)]
  if (rule?.mode === 'off') return { source: 'off', inputs: [] }
  if (rule?.mode === 'manual') return { source: 'manual', inputs: rule.names.map(name => ({ name, amount: '' })) }
  if (item.ingredients?.length) return { source: 'pdf', inputs: item.ingredients }
  return { source: 'automatic', inputs: automaticIngredients(item.name).map(name => ({ name, amount: '' })) }
}

export function resolveIngredients(item, rules = { version: 1, items: {} }) {
  const root = composition(item, rules), warnings = [], leaves = new Map()
  let visited = 0
  function visit(node, path, ancestors, inferred, depth) {
    if (++visited > 1000) { if (!warnings.includes('node-limit')) warnings.push('node-limit'); return }
    const key = ingredientKey(node.name)
    if (ancestors.has(key)) { warnings.push('cycle: ' + [...path, node.name].join(' → ')); return }
    if (depth > 12) { warnings.push('depth-limit: ' + node.name); return }
    const current = depth === 0 ? root : composition(node, rules)
    const chain = [...path, node.name], next = new Set([...ancestors, key])
    const derived = inferred || current.source === 'automatic'
    for (const input of current.inputs) {
      if (visited > 1000) break
      const childRule = rules.items[ingredientKey(input.name)]
      if (childRule || input.ingredients?.length) {
        visit(input, chain, next, derived, depth + 1)
        continue
      }
      const direct = canonicalIngredient(input.name)
      const name = direct?.matched ? direct.name : generalIngredient(input.name) ?? input.name
      const canonical = canonicalIngredient(name)
      if (!canonical) continue
      const evidence = derived ? 'inferred' : current.source === 'manual' ? 'manual' : 'source'
      const provenance = { path: [...chain, input.name], evidence }
      const existing = leaves.get(canonical.id)
      if (existing) {
        existing.provenancePaths.push(provenance)
        existing.amount = ''
        const rank = { inferred: 0, source: 1, manual: 2 }
        if (rank[evidence] > rank[existing.evidence]) {
          existing.evidence = evidence
          existing.ingredientSource = current.source
          existing.originName = input.name
        }
      } else {
        leaves.set(canonical.id, { name: canonical.name, amount: depth === 0 ? input.amount ?? '' : '', originName: input.name, originFood: item.name, ingredientSource: current.source, ingredientId: canonical.id, evidence, provenancePaths: [provenance] })
      }
    }
  }
  visit(item, [], new Set(), false, 0)
  const ingredients = [...leaves.values()]
  return { source: root.source, completeness: ingredients.length ? 'partial' : 'unknown', ingredients, originalIngredients: (item.ingredients ?? []).map(ingredient => ({ ...ingredient })), warnings }
}

export function ingredientSlots(slots, rules) {
  return slots.map(slot => ({ ...slot, items: slot.items.map(item => {
    const resolved = resolveIngredients(item, rules)
    return { ...item, ingredients: resolved.ingredients }
  }) }))
}
