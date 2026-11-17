import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFoodContext } from '../src/food-context.mjs'

test('nested aliases retain every original name after resolver deduplication', () => {
  const rules = {version:1,items:{'oběd':{mode:'manual',names:['Příloha','Eidam']},'příloha':{mode:'manual',names:['Gouda']}}}
  const slots = [{key:'meal',day:'2026-11-17',category:'Oběd',items:[{name:'Oběd',ingredients:[],amount:'200 g',kcal:200}]}]
  const context = buildFoodContext(slots,rules)
  assert.equal(context.ingredients.length,1)
  assert.equal(context.ingredients[0].occurrences.length,1)
  assert.deepEqual(new Set(context.ingredients[0].occurrences[0].originalNames),new Set(['Gouda','Eidam']))
  assert.deepEqual(context.ingredients[0].occurrences[0].evidence,['manual'])
})

test('source and manual paths remain visible for the same ingredient in one dish', () => {
  const rules = {version:1,items:{'příloha':{mode:'manual',names:['Gouda']}}}
  const slots = [{key:'meal',day:'2026-11-17',category:'Oběd',items:[{name:'Oběd',ingredients:[{name:'Příloha',amount:''},{name:'Eidam',amount:'20 g'}],amount:'200 g',kcal:200}]}]
  const occurrence = buildFoodContext(slots,rules).ingredients[0].occurrences[0]
  assert.deepEqual(new Set(occurrence.evidence),new Set(['manual','source']))
  assert.deepEqual(new Set(occurrence.originalNames),new Set(['Gouda','Eidam']))
})
