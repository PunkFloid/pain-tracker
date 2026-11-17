import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalIngredient as canonical } from '../src/ingredient-identity.mjs'
import { resolveIngredients } from '../src/ingredient-resolution.mjs'
import { canonicalReviewId, previewIngredientReviewMigration } from '../src/ingredient-review-migration.mjs'

test('English aliases share Czech ingredient identities', () => {
  for (const [en, cs] of [['chicken breast','kuřecí prsa'],['rice','Rýže'],['onion','Cibule'],['olive oil','Olivový olej'],['egg','Vejce']]) {
    assert.equal(canonical(en).id, canonical(cs).id)
    assert.equal(canonical(en).name, canonical(cs).name)
  }
  assert.equal(canonical('rice').id, 'ingredient:raw:rýže')
})
test('modifiers and unknown names are not silently collapsed', () => {
  assert.equal(canonical('lactose-free milk').id, canonical('mléko bez laktózy').id)
  assert.notEqual(canonical('milk').id, canonical('lactose-free milk').id)
  assert.notEqual(canonical('almond milk').id, canonical('milk').id)
  assert.notEqual(canonical('peanut butter').id, canonical('butter').id)
  assert.notEqual(canonical('olive oil').id, canonical('oil').id)
  assert.equal(canonical('unknown sauce').matched, false)
  assert.equal(canonical('unknown sauce').name, 'unknown sauce')
})
test('resolution deduplicates languages while preserving original provenance', () => {
  const resolved = resolveIngredients({name:'Test dish',ingredients:[{name:'onion',amount:''},{name:'Cibule',amount:''}]}, {version:1,items:{}}, {version:1,items:{}})
  assert.equal(resolved.ingredients.length, 1)
  assert.equal(resolved.ingredients[0].name, 'Cibule')
  assert.equal(resolved.ingredients[0].provenancePaths.length, 2)
  assert.equal(resolved.originalIngredients[0].name, 'onion')
})
test('reviews under old English raw identities remain available and migrate', () => {
  const oldId = canonicalReviewId('ingredient:raw:chicken breast')
  const target = canonicalReviewId(canonical('kuřecí prsa').id)
  const reviews = {version:1,items:{[oldId]:{note:'Historická poznámka',updatedAt:'2026-11-17',acceptedPainIds:['pain-1']}}}
  const result = previewIngredientReviewMigration(reviews)
  assert.equal(result.aliases[oldId], target)
  assert.deepEqual(result.reviews.items[target], reviews.items[oldId])
  assert.deepEqual(result.reviews.items[oldId], reviews.items[oldId])
  assert.equal(Object.keys(reviews.items).length, 1)
  const repeated = previewIngredientReviewMigration(result.reviews)
  assert.deepEqual(repeated.reviews, result.reviews)
})
