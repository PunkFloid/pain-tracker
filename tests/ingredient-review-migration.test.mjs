import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalReviewId, previewIngredientReviewMigration } from '../src/ingredient-review-migration.mjs'
const raw = name => 'ingredient|' + JSON.stringify(['raw', name])
const review = (status, note = '') => ({ status, note, updatedAt: '2026-11-17T10:00:00Z' })
const data = items => ({ version: 1, items })
const cheese = canonicalReviewId('ingredient:cheese')

test('aliases merge without losing notes, decisions or original entries', () => {
  const source = data({ [raw('gouda')]: { ...review('ok', 'První poznámka'), acceptedPainIds: ['p2'] }, [raw('eidam')]: { ...review('ok', 'Druhá poznámka'), acceptedPainIds: ['p1', 'p2'] } })
  const before = JSON.stringify(source)
  const result = previewIngredientReviewMigration(source)
  assert.equal(result.reviews.items[cheese].status, 'ok')
  assert.equal(result.reviews.items[cheese].note, 'První poznámka\n\nDruhá poznámka')
  assert.deepEqual(result.reviews.items[cheese].acceptedPainIds, ['p1', 'p2'])
  assert.deepEqual(result.original, source)
  assert.deepEqual(result.reviews.items[raw('gouda')], source.items[raw('gouda')])
  assert.equal(JSON.stringify(source), before)
})
test('conflicting statuses are explicit and never silently applied', () => {
  const result = previewIngredientReviewMigration(data({ [raw('gouda')]: review('ok'), [raw('eidam')]: review('suspect') }))
  assert.equal(result.conflicts.length, 1)
  assert.equal(result.conflicts[0].reason, 'status')
  assert.equal(result.conflicts[0].entries.length, 2)
  assert.equal(result.reviews.items[cheese], undefined)
})
test('food reviews and custom ingredient groups remain untouched', () => {
  const food = 'food|' + JSON.stringify(['raw', 'bramborová kaše'])
  const group = 'ingredient|' + JSON.stringify(['group', 1, 'moje směs'])
  const source = data({ [food]: review('suspect'), [group]: review('ok') })
  const result = previewIngredientReviewMigration(source)
  assert.deepEqual(result.reviews, source)
  assert.deepEqual(result.aliases, {})
})
test('explicit lactose-free identity is not merged with ordinary milk', () => {
  const result = previewIngredientReviewMigration(data({ [raw('mléko')]: review('suspect'), [raw('mléko bez laktózy')]: review('ok') }))
  assert.equal(result.reviews.items[canonicalReviewId('ingredient:milk')].status, 'suspect')
  assert.equal(result.reviews.items[canonicalReviewId('ingredient:milk:lactose-free')].status, 'ok')
  assert.equal(result.conflicts.length, 0)
})
test('existing canonical decisions win and rerunning preview is idempotent', () => {
  const source = data({ [raw('gouda')]: review('ok', 'Historie'), [cheese]: review('suspect', 'Nové rozhodnutí') })
  const first = previewIngredientReviewMigration(source)
  const second = previewIngredientReviewMigration(first.reviews)
  assert.deepEqual(first.reviews.items[cheese], source.items[cheese])
  assert.deepEqual(second.reviews, first.reviews)
  assert.deepEqual(first.reviews.items[raw('gouda')], source.items[raw('gouda')])
})
test('oversized combined notes are preserved as a conflict, not truncated', () => {
  const result = previewIngredientReviewMigration(data({ [raw('gouda')]: review('ok', 'a'.repeat(1500)), [raw('eidam')]: review('ok', 'b'.repeat(1500)) }))
  assert.equal(result.conflicts[0].reason, 'note-length')
  assert.equal(result.conflicts[0].entries[0].review.note.length, 1500)
  assert.equal(result.reviews.items[cheese], undefined)
})
