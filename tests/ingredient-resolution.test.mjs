import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveIngredients, ingredientSlots } from '../src/ingredient-resolution.mjs'
import { writeIngredientRule, readIngredientRules } from '../src/ingredient-rules.mjs'
const item = { name: 'Kaše', amount: '200 g', kcal: 200, ingredients: [{ name: 'mléko', amount: '50 ml' }] }
const manual = { version: 1, items: { 'kaše': { mode: 'manual', names: ['Brambory', 'Mléko bez laktózy'] } } }
test('manual composition overrides PDF without mutating imported data', () => {
  const before = JSON.stringify(item)
  const result = resolveIngredients(item, manual)
  assert.equal(result.source, 'manual')
  assert.equal(result.ingredients.length, 2)
  assert.ok(result.ingredients.every(i => i.evidence === 'manual' && i.amount === ''))
  assert.equal(result.ingredients[1].ingredientId, 'ingredient:milk:lactose-free')
  assert.deepEqual(result.originalIngredients, item.ingredients)
  assert.equal(JSON.stringify(item), before)
})
test('source ingredients retain quantities, provenance and conservative completeness', () => {
  const result = resolveIngredients(item)
  assert.equal(result.source, 'pdf')
  assert.equal(result.completeness, 'partial')
  assert.equal(result.ingredients[0].evidence, 'source')
  assert.equal(result.ingredients[0].amount, '50 ml')
  assert.equal(result.ingredients[0].originName, 'mléko')
  assert.equal(result.ingredients[0].originFood, 'Kaše')
  assert.equal(result.ingredients[0].ingredientId, 'ingredient:milk')
})
test('off suppresses analysis but retains imported ingredients; reset restores PDF', () => {
  const data = new Map()
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  writeIngredientRule(item.name, 'off', [], storage)
  const off = resolveIngredients(item, readIngredientRules(storage))
  assert.equal(off.source, 'off')
  assert.deepEqual(off.ingredients, [])
  assert.deepEqual(off.originalIngredients, item.ingredients)
  writeIngredientRule(item.name, 'auto', [], storage)
  assert.equal(resolveIngredients(item, readIngredientRules(storage)).source, 'pdf')
})
test('inference is labeled and unresolved composition stays unknown', () => {
  const inferred = resolveIngredients({ ...item, name: 'Perník domácí', ingredients: [] })
  assert.ok(inferred.ingredients.length > 0)
  assert.ok(inferred.ingredients.every(i => i.evidence === 'inferred'))
  const unknown = resolveIngredients({ ...item, name: 'Hnědá omáčka', ingredients: [] })
  assert.equal(unknown.completeness, 'unknown')
  assert.deepEqual(unknown.ingredients, [])
})
test('historical overlay applies overrides without changing source slots or attaching tracking keys', () => {
  const slots = [{ key: 'example', items: [item] }]
  const before = JSON.stringify(slots)
  const result = ingredientSlots(slots, manual)
  assert.equal(result[0].items[0].ingredients[0].evidence, 'manual')
  assert.ok(result[0].items[0].ingredients.every(i => !Object.hasOwn(i, 'tracking')))
  assert.equal(JSON.stringify(slots), before)
})
