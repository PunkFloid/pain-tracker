import test from 'node:test'
import assert from 'node:assert/strict'
import {createAiIngredientRequest,aiIngredientRequestKey,parseAiIngredientProposal} from '../src/ai-ingredients.mjs'
const request=()=>createAiIngredientRequest({name:'Bramborová kaše',ingredients:[{name:'Brambory'}]})
const response=r=>({version:1,foodKey:r.foodKey,ingredients:[{name:'Brambory',basis:'named'},{name:'Mléko',basis:'typical'}],needsReview:true})
test('request whitelists names and excludes unrelated health and consumption fields',()=>{
  const result=createAiIngredientRequest({name:'Kaše',day:'2026-11-17',pains:[{intensity:9}],medications:['Lék'],note:'Soukromé',ingredients:[{name:'Brambory',amount:'200 g',note:'Soukromé'}]})
  assert.deepEqual(result,{version:1,foodKey:'kaše',foodName:'Kaše',knownIngredients:['Brambory']})
})
test('request key ignores ingredient ordering but changes with known composition',()=>{
  const a=createAiIngredientRequest({name:'Kaše',ingredients:[{name:'Mléko'},{name:'Brambory'}]})
  const b=createAiIngredientRequest({name:'kaše',ingredients:[{name:'Brambory'},{name:'Mléko'}]})
  assert.equal(aiIngredientRequestKey(a),aiIngredientRequestKey(b))
  assert.notEqual(aiIngredientRequestKey(a),aiIngredientRequestKey(request()))
})
test('even named AI ingredients remain inferred and completeness is unknown',()=>{
  const r=request(),result=parseAiIngredientProposal(JSON.stringify(response(r)),r)
  assert.ok(result.ingredients.every(i=>i.evidence==='inferred'&&i.ingredientSource==='ai'))
  assert.equal(result.completeness,'unknown')
  assert.equal(result.needsReview,true)
})
test('rejects foreign food, extra fields and invalid ingredient basis',()=>{
  const r=request()
  assert.throws(()=>parseAiIngredientProposal({...response(r),foodKey:'pizza'},r))
  assert.throws(()=>parseAiIngredientProposal({...response(r),confidence:1},r))
  assert.throws(()=>parseAiIngredientProposal({...response(r),ingredients:[{name:'Mléko',basis:'verified'}]},r))
  assert.throws(()=>parseAiIngredientProposal({...response(r),ingredients:[{name:'Mléko',basis:'named',amount:'20 ml'}]},r))
})
test('enforces size limits, normalizes duplicates and flags empty answers',()=>{
  const r=request()
  assert.throws(()=>createAiIngredientRequest({name:'a'.repeat(301)}))
  assert.throws(()=>parseAiIngredientProposal('a'.repeat(50001),r))
  const result=parseAiIngredientProposal({...response(r),ingredients:[{name:'Mléko',basis:'typical'},{name:' mléko ',basis:'typical'}]},r)
  assert.equal(result.ingredients.length,1)
  assert.equal(parseAiIngredientProposal({...response(r),ingredients:[],needsReview:false},r).needsReview,true)
})
