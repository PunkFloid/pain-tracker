import test from 'node:test'
import assert from 'node:assert/strict'
import {handleAiRequest} from '../server/ai-worker.mjs'
import {createAiIngredientRequest} from '../src/ai-ingredients.mjs'
const token='a'.repeat(40),origin='https://app.example.invalid'
const env=()=>({AI_ENABLED:'true',ALLOWED_ORIGIN:origin,OPENAI_API_KEY:'server-only-secret',APP_AUTH_TOKEN:token,OPENAI_MODEL:'test-model',RATE_LIMITER:{limit:async()=>({success:true})}})
const input=()=>createAiIngredientRequest({name:'Hnědá omáčka'})
function request(body=input(),headers={}){return new Request('https://api.example.invalid/ingredients',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json',...headers},body:JSON.stringify(body)})}
const never=async()=>{throw new Error('Unexpected external call')}
test('disabled or incomplete configuration refuses AI calls',async()=>{
  assert.equal((await handleAiRequest(request(),{...env(),AI_ENABLED:'false'},never)).status,503)
  assert.equal((await handleAiRequest(request(),{...env(),RATE_LIMITER:undefined},never)).status,503)
})
test('origin and auth are separate requirements',async()=>{
  assert.equal((await handleAiRequest(request(undefined,{Origin:'https://other.example.invalid'}),env(),never)).status,403)
  assert.equal((await handleAiRequest(request(undefined,{Authorization:'Bearer wrong'}),env(),never)).status,401)
})
test('preflight does not call provider',async()=>{
  const r=new Request('https://api.example.invalid/ingredients',{method:'OPTIONS',headers:{Origin:origin}})
  const response=await handleAiRequest(r,env(),never)
  assert.equal(response.status,204)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin)
})
test('extra health data and oversize input are rejected before provider call',async()=>{
  assert.equal((await handleAiRequest(request({...input(),pains:[1]}),env(),never)).status,400)
  const large=new Request('https://api.example.invalid/ingredients',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'x'.repeat(24001)})
  assert.equal((await handleAiRequest(large,env(),never)).status,400)
})
test('limiter refuses requests and fails closed',async()=>{
  assert.equal((await handleAiRequest(request(),{...env(),RATE_LIMITER:{limit:async()=>({success:false})}},never)).status,429)
  assert.equal((await handleAiRequest(request(),{...env(),RATE_LIMITER:{limit:async()=>{throw new Error('down')}}},never)).status,503)
})
test('provider receives only whitelisted data and successful reply contains no secrets',async()=>{
  let sent
  const fetcher=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(options.body);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({version:1,foodKey:input().foodKey,ingredients:[{name:'Cibule',basis:'typical'}],needsReview:true})}]}]})}
  const response=await handleAiRequest(request(),env(),fetcher)
  assert.equal(response.status,200)
  assert.equal(sent.store,false)
  assert.equal(sent.text.format.strict,true)
  assert.deepEqual(JSON.parse(sent.input),input())
  const text=await response.text();assert.ok(!text.includes('server-only-secret'));assert.equal(JSON.parse(text).needsReview,true)
})
test('provider errors and invalid proposals never leak upstream text',async()=>{
  const failed=await handleAiRequest(request(),env(),async()=>new Response('sensitive upstream body',{status:500}))
  assert.equal(failed.status,502);assert.ok(!(await failed.text()).includes('sensitive'))
  const invalid=await handleAiRequest(request(),env(),async()=>Response.json({status:'completed',output:[]}))
  assert.equal(invalid.status,502)
})
