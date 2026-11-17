import test from 'node:test'
import assert from 'node:assert/strict'
import {requestAiIngredientProposal,AI_INGREDIENT_ENDPOINT} from '../src/ai-ingredient-client.mjs'
import {createAiIngredientRequest} from '../src/ai-ingredients.mjs'
import {saveAiIngredientProposal,readAiIngredientCache} from '../src/ai-ingredient-cache.mjs'
const token='x'.repeat(64),item={name:'Hnědá omáčka',ingredients:[]}
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
const reply=()=>({version:1,foodKey:createAiIngredientRequest(item).foodKey,ingredients:[{name:'Cibule',basis:'typical'}],needsReview:true})
test('explicit call only sends allowed fields to the fixed endpoint and saves valid result',async()=>{
  const s=storage();let calls=0
  const result=await requestAiIngredientProposal({...item,pains:[1],note:'private'},token,{storage:s,fetcher:async(url,options)=>{calls++;assert.equal(url,AI_INGREDIENT_ENDPOINT);assert.deepEqual(JSON.parse(options.body),createAiIngredientRequest(item));assert.equal(options.headers.Authorization,'Bearer '+token);assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');return Response.json(reply())}})
  assert.equal(calls,1);assert.equal(result.fromCache,false);assert.equal(result.proposal.ingredients[0].evidence,'inferred')
  assert.equal(Object.keys(readAiIngredientCache(s).items).length,1)
  assert.ok(!JSON.stringify(readAiIngredientCache(s)).includes(token))
})
test('cached proposal returns without any external request or token',async()=>{
  const s=storage();saveAiIngredientProposal(createAiIngredientRequest(item),reply(),s)
  let calls=0
  const result=await requestAiIngredientProposal(item,'',{storage:s,fetcher:async()=>{calls++;throw new Error('network')}})
  assert.equal(result.fromCache,true);assert.equal(calls,0)
})
test('quota exhaustion does not retry, fallback or write cache',async()=>{
  const s=storage();let calls=0
  await assert.rejects(()=>requestAiIngredientProposal(item,token,{storage:s,fetcher:async()=>{calls++;return Response.json({error:'groq_free_quota_exhausted'},{status:429})}}),/kvóta/u)
  assert.equal(calls,1);assert.equal(Object.keys(readAiIngredientCache(s).items).length,0)
})
test('invalid proposal is not persisted and missing token does not call network',async()=>{
  const s=storage();let calls=0
  await assert.rejects(()=>requestAiIngredientProposal(item,'',{storage:s,fetcher:async()=>{calls++;return Response.json(reply())}}))
  assert.equal(calls,0)
  await assert.rejects(()=>requestAiIngredientProposal(item,token,{storage:s,fetcher:async()=>Response.json({...reply(),foodKey:'jiné jídlo'})}))
  assert.equal(Object.keys(readAiIngredientCache(s).items).length,0)
})
test('disabled server explains setup and pre-aborted request never calls network',async()=>{
  const s=storage()
  await assert.rejects(()=>requestAiIngredientProposal(item,token,{storage:s,fetcher:async()=>Response.json({error:'ai_disabled'},{status:503})}),/vypnutý/u)
  const controller=new AbortController();controller.abort();let calls=0
  await assert.rejects(()=>requestAiIngredientProposal(item,token,{storage:s,signal:controller.signal,fetcher:async()=>{calls++;return Response.json(reply())}}),/zrušen/u)
  assert.equal(calls,0)
})
