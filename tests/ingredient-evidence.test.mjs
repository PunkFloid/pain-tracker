import test from 'node:test'
import assert from 'node:assert/strict'
import { readIncludeInferred, writeIncludeInferred, filterIngredientEvidence } from '../src/ingredient-evidence.mjs'
import { ingredientSlots } from '../src/ingredient-resolution.mjs'
import { followUp } from '../src/follow-up.mjs'
test('preference defaults to inclusive and persists either mode',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}
  assert.equal(readIncludeInferred(storage),true)
  writeIncludeInferred(false,storage);assert.equal(readIncludeInferred(storage),false)
  writeIncludeInferred(true,storage);assert.equal(readIncludeInferred(storage),true)
  assert.throws(()=>writeIncludeInferred('false',storage),TypeError)
  storage.setItem('pain-tracker-ingredient-evidence','{}')
  assert.throws(()=>readIncludeInferred(storage))
})
test('strict filter excludes inferred and unlabeled entries without mutating data',()=>{
  const slots=[{items:[{ingredients:[{name:'A',evidence:'manual'},{name:'B',evidence:'source'},{name:'C',evidence:'inferred'},{name:'D'}]}]}]
  const before=JSON.stringify(slots)
  assert.deepEqual(filterIngredientEvidence(slots,false)[0].items[0].ingredients.map(i=>i.name),['A','B'])
  assert.equal(filterIngredientEvidence(slots,true),slots)
  assert.equal(JSON.stringify(slots),before)
})
test('strict statistics keep a source-backed occurrence when another occurrence is inferred',()=>{
  const make=name=>({name,ingredients:[],amount:'100 g',kcal:100})
  const slots=[{key:'a',day:'2026-11-01',category:'Snídaně',items:[make('Perník domácí')]},{key:'b',day:'2026-11-02',category:'Snídaně',items:[{...make('Pečivo'),ingredients:[{name:'Mouka',amount:'20 g'}]}]}]
  const resolved=ingredientSlots(slots)
  const now=Date.parse('2026-11-10T12:00:00Z')
  assert.equal(followUp(resolved,[],[],'ingredient','UTC',now)[0].occasions,2)
  assert.equal(followUp(filterIngredientEvidence(resolved,false),[],[],'ingredient','UTC',now)[0].occasions,1)
})
