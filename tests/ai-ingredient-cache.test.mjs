import test from 'node:test'
import assert from 'node:assert/strict'
import {createAiIngredientRequest} from '../src/ai-ingredients.mjs'
import {readAiIngredientCache,saveAiIngredientProposal,cachedAiIngredientProposal,selectAiIngredientFallback} from '../src/ai-ingredient-cache.mjs'
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
const food=(name='Hnědá omáčka',ingredients=[])=>({name,ingredients,amount:'100 g',kcal:100})
const reply=(request,needsReview=false)=>({version:1,foodKey:request.foodKey,ingredients:[{name:'Cibule',basis:'typical'}],needsReview})
const rules={version:1,items:{}}
test('validated proposal round-trips and remains inferred',()=>{
  const s=storage(),item=food(),request=createAiIngredientRequest(item)
  saveAiIngredientProposal(request,reply(request),s)
  const cache=readAiIngredientCache(s),proposal=cachedAiIngredientProposal(item,cache)
  assert.equal(proposal.ingredients[0].evidence,'inferred')
  assert.equal(selectAiIngredientFallback(item,rules,cache).ingredients[0].name,'Cibule')
})
test('changed known composition cannot reuse an old proposal',()=>{
  const s=storage(),request=createAiIngredientRequest(food())
  saveAiIngredientProposal(request,reply(request),s)
  assert.equal(cachedAiIngredientProposal(food('Hnědá omáčka',[{name:'Mléko'}]),readAiIngredientCache(s)),null)
})
test('review-required answers are cached but never selected automatically',()=>{
  const s=storage(),request=createAiIngredientRequest(food())
  saveAiIngredientProposal(request,reply(request,true),s)
  const cache=readAiIngredientCache(s)
  assert.equal(cachedAiIngredientProposal(food(),cache).needsReview,true)
  assert.equal(selectAiIngredientFallback(food(),rules,cache),null)
})
test('manual rules, disabled recipes, PDF and existing automatic rules take priority',()=>{
  const s=storage(),request=createAiIngredientRequest(food())
  saveAiIngredientProposal(request,reply(request),s)
  const cache=readAiIngredientCache(s)
  for(const mode of ['manual','off'])assert.equal(selectAiIngredientFallback(food(),{version:1,items:{'hnědá omáčka':{mode,names:['Mléko']}}},cache),null)
  assert.equal(selectAiIngredientFallback(food('Hnědá omáčka',[{name:'Mléko'}]),rules,cache),null)
  assert.equal(selectAiIngredientFallback(food('Perník domácí'),rules,cache),null)
})
test('invalid responses and persistence failures do not report success',()=>{
  const s=storage(),request=createAiIngredientRequest(food())
  assert.throws(()=>saveAiIngredientProposal(request,{...reply(request),foodKey:'jiné jídlo'},s))
  assert.deepEqual(readAiIngredientCache(s),{version:1,items:{}})
  assert.throws(()=>saveAiIngredientProposal(request,reply(request),{getItem:()=>null,setItem:()=>{throw new Error('quota')}}))
})
test('stored corruption is detected rather than treated as valid AI composition',()=>{
  const s=storage()
  s.setItem('pain-tracker-ai-ingredient-cache','{"version":2,"items":{}}')
  assert.throws(()=>readAiIngredientCache(s))
})
