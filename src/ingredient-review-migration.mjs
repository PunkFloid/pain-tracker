import { canonicalIngredient } from './ingredient-identity.mjs'

export function canonicalReviewId(ingredientId) {
  return 'ingredient|' + JSON.stringify(['ingredient', 1, ingredientId])
}

function targetFor(id) {
  if (!id.startsWith('ingredient|')) return null
  let key
  try { key = JSON.parse(id.slice('ingredient|'.length)) } catch { return null }
  if (!Array.isArray(key)) return null
  if (key.length === 3 && key[0] === 'ingredient' && key[1] === 1 && typeof key[2] === 'string' && key[2]) {
    if (key[2].startsWith('ingredient:raw:')) {
      const ingredient = canonicalIngredient(key[2].slice('ingredient:raw:'.length))
      return ingredient ? canonicalReviewId(ingredient.id) : id
    }
    return id
  }
  // Custom tracking groups cannot safely be interpreted as single ingredients.
  if (key.length !== 2 || key[0] !== 'raw' || typeof key[1] !== 'string') return null
  const ingredient = canonicalIngredient(key[1])
  return ingredient ? canonicalReviewId(ingredient.id) : null
}

export function previewIngredientReviewMigration(reviews) {
  const original = JSON.parse(JSON.stringify(reviews))
  const items = { ...original.items }
  const groups = new Map()
  const aliases = {}
  for (const [id, review] of Object.entries(original.items)) {
    const target = targetFor(id)
    if (!target) continue
    aliases[id] = target
    const entries = groups.get(target) ?? []
    entries.push({ id, review })
    groups.set(target, entries)
  }
  const conflicts = []
  for (const [target, entries] of groups) {
    // A decision already made under the new identity overrides historical aliases.
    if (original.items[target]) continue
    const statuses = [...new Set(entries.map(e => e.review.status).filter(Boolean))]
    const conflict = statuses.length > 1
    const notes = entries.filter(e => e.review.note).map(e => e.review.note)
    const note = [...new Set(notes)].join('\n\n')
    // Never silently truncate notes to the current editor limit.
    if (conflict || note.length > 2000) {
      conflicts.push({ target, reason: conflict ? 'status' : 'note-length', entries })
      continue
    }
    const updatedAt = entries.map(e => e.review.updatedAt).sort().at(-1) ?? ''
    const entry = { note, updatedAt }
    if (statuses.length) entry.status = statuses[0]
    const changed = entries.map(e => e.review.statusChangedAt).filter(Boolean).sort()
    if (changed.length) entry.statusChangedAt = changed.at(-1)
    const accepted = entries.flatMap(e => e.review.acceptedPainIds ?? [])
    if (entries.some(e => e.review.acceptedPainIds !== undefined)) entry.acceptedPainIds = [...new Set(accepted)].sort()
    items[target] = entry
  }
  return { version: 1, reviews: { version: 1, items }, original, aliases, conflicts }
}
