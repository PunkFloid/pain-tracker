import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveIngredients } from '../src/ingredient-resolution.mjs'
const food = (name, ingredients = []) => ({ name, ingredients, amount: '200 g', kcal: 200 })
const rules = items => ({ version: 1, items: Object.fromEntries(Object.entries(items).map(([name,names]) => [name, { mode: 'manual', names }])) })
test('nested recipes flatten and preserve full provenance', () => {
  const recipe = rules({ 'oběd': ['Příloha', 'Sýr'], 'příloha': ['Brambory', 'Mléko'] })
  const result = resolveIngredients(food('Oběd'), recipe)
  assert.deepEqual(new Set(result.ingredients.map(i=>i.name)), new Set(['Brambory','Mléko','Sýr']))
  assert.deepEqual(result.ingredients[0].provenancePaths[0].path, ['Oběd','Příloha','Brambory'])
  assert.equal(result.ingredients[0].evidence, 'manual')
  assert.deepEqual(result.warnings, [])
})
test('cycles stop without falsely emitting the cyclic recipe as a raw ingredient', () => {
  const result = resolveIngredients(food('A'), rules({ 'a': ['B','Mléko'], 'b': ['A','Sýr'] }))
  assert.ok(result.warnings.some(w=>w.startsWith('cycle:')))
  assert.deepEqual(new Set(result.ingredients.map(i=>i.name)),new Set(['Mléko','Sýr']))
})
test('repeated ingredient is one leaf with all paths retained', () => {
  const result = resolveIngredients(food('Oběd'), rules({ 'oběd': ['Příloha','Mléko'], 'příloha': ['Mléko'] }))
  assert.equal(result.ingredients.length,1)
  assert.equal(result.ingredients[0].provenancePaths.length,2)
  assert.equal(result.ingredients[0].amount,'')
})
test('inferred ancestor keeps descendants inferred despite manual subrecipe', () => {
  const result = resolveIngredients(food('Perník domácí'), rules({ 'mouka': ['Pšenice'] }))
  assert.equal(result.ingredients[0].evidence,'inferred')
  assert.deepEqual(result.ingredients[0].provenancePaths[0].path,['Perník domácí','Mouka','Pšenice'])
})
test('nested imported amounts are not presented as consumed amounts', () => {
  const nested = { name:'Příloha', amount:'100 g', ingredients:[{name:'Mléko',amount:'1 l'}] }
  const result = resolveIngredients(food('Oběd',[nested]))
  assert.equal(result.ingredients[0].amount,'')
  assert.equal(result.ingredients[0].evidence,'source')
  assert.equal(nested.ingredients[0].amount,'1 l')
})
test('depth limit and disabled subrecipes stop safely', () => {
  const items = {}
  for(let i=0;i<20;i++)items['r'+i]=['r'+(i+1)]
  const result = resolveIngredients(food('r0'),rules(items))
  assert.ok(result.warnings.some(w=>w.startsWith('depth-limit:')))
  const disabled = rules({ 'oběd':['Příloha','Mléko'] })
  disabled.items['příloha']={mode:'off',names:[]}
  assert.deepEqual(resolveIngredients(food('Oběd'),disabled).ingredients.map(i=>i.name),['Mléko'])
})
