import test from 'node:test'
import assert from 'node:assert/strict'
import { requestAiIngredientProposal } from '../src/ai-ingredient-client.mjs'
import { createAiIngredientRequest, AI_INGREDIENTS_INSTRUCTIONS } from '../src/ai-ingredients.mjs'
import { saveAiIngredientProposal, readAiIngredientCache, cachedAiIngredientProposal } from '../src/ai-ingredient-cache.mjs'
const item={name:'Neznámý pokrm',ingredients:[]}
const token='a'.repeat(64)
function fixture(){
  const values=new Map()
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}
  const request=createAiIngredientRequest(item)
  const response=name=>({version:1,foodKey:request.foodKey,ingredients:[{name,basis:'typical'}],needsReview:false})
  saveAiIngredientProposal(request,response('onion'),storage)
  return {storage,response}
}
test('cache remains the default and refresh explicitly replaces one proposal',async()=>{
  const {storage,response}=fixture();let calls=0
  const fetcher=async()=>{calls++;return Response.json(response('cibule'))}
  const old=await requestAiIngredientProposal(item,'',{storage,fetcher})
  assert.equal(old.fromCache,true);assert.equal(calls,0)
  const fresh=await requestAiIngredientProposal(item,token,{storage,fetcher,forceRefresh:true})
  assert.equal(fresh.fromCache,false);assert.equal(calls,1)
  assert.equal(fresh.proposal.ingredients[0].name,'cibule')
  assert.equal(cachedAiIngredientProposal(item,readAiIngredientCache(storage)).ingredients[0].name,'cibule')
})
test('failed refresh preserves cache without retries',async()=>{
  for(const fetcher of [async()=>Response.json({error:'groq_free_quota_exhausted'},{status:429}),async()=>Response.json({bad:true}),async()=>{throw new Error('offline')}]){
    const {storage}=fixture();const before=JSON.stringify(readAiIngredientCache(storage));let calls=0
    await assert.rejects(requestAiIngredientProposal(item,token,{storage,forceRefresh:true,fetcher:async(...args)=>{calls++;return fetcher(...args)}}))
    assert.equal(calls,1);assert.equal(JSON.stringify(readAiIngredientCache(storage)),before)
  }
})
test('Czech prompt retains technical keys and uncertainty rules',()=>{
  for(const phrase of ['ingredients[].name','česky s českou diakritikou','foodKey přesně shodný','needsReview=true','named a typical nepřekládej'])assert.ok(AI_INGREDIENTS_INSTRUCTIONS.includes(phrase))
})
