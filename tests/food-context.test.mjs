import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFoodContext } from '../src/food-context.mjs'
const item=(name,ingredients=[])=>({name,ingredients,amount:'100 g',kcal:100})
const slot=(items,key='meal')=>({key,day:'2026-11-01',category:'Snídaně',items})
test('same ingredient preserves both source dishes without duplicating one source',()=>{
  const slots=[slot([item('Pokrm A',[{name:'Gouda',amount:''},{name:'Eidam',amount:''}]),item('Pokrm B',[{name:'Mozzarella',amount:''}])])]
  const before=JSON.stringify(slots)
  const context=buildFoodContext(slots)
  assert.equal(context.ingredients.length,1)
  assert.equal(context.ingredients[0].occurrences.length,2)
  assert.deepEqual(context.ingredients[0].occurrences.map(o=>o.food),['Pokrm A','Pokrm B'])
  assert.equal(context.ingredients[0].occurrences[0].originalNames.length,2)
  assert.deepEqual(context.ingredients[0].occurrences[0].evidence,['source'])
  assert.equal(JSON.stringify(slots),before)
})
test('unknown and intentionally disabled foods are kept separate',()=>{
  const rules={version:1,items:{'perník domácí':{mode:'off',names:[]}}}
  const context=buildFoodContext([slot([item('Hnědá omáčka'),item('Perník domácí')])],rules)
  assert.equal(context.unresolved[0].name,'Hnědá omáčka')
  assert.equal(context.disabled[0].name,'Perník domácí')
  assert.equal(context.ingredients.length,0)
})
test('same unknown food groups historical occurrences and inference remains labeled',()=>{
  const context=buildFoodContext([slot([item('Hnědá omáčka'),item('Perník domácí')],'a'),slot([item('Hnědá omáčka')],'b')])
  assert.equal(context.unresolved.length,1)
  assert.equal(context.unresolved[0].occurrences.length,2)
  assert.ok(context.ingredients[0].occurrences[0].evidence.includes('inferred'))
})
