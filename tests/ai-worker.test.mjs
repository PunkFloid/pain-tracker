import test from 'node:test'
import assert from 'node:assert/strict'
import worker,{handleAiRequest} from '../server/ai-worker.mjs'
import {createAiIngredientRequest} from '../src/ai-ingredients.mjs'
const token='a'.repeat(40),origin='https://app.example.invalid'
const env=()=>({AI_ENABLED:'true',GROQ_FREE_TIER_CONFIRMED:'true',ALLOWED_ORIGIN:origin,GROQ_API_KEY:'server-only-secret',APP_AUTH_TOKEN:token,RATE_LIMITER:{limit:async()=>({success:true})}})
const input=()=>createAiIngredientRequest({name:'Hnědá omáčka'})
function request(body=input(),headers={}){return new Request('https://api.example.invalid/ingredients',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json',...headers},body:JSON.stringify(body)})}
const never=async()=>{throw new Error('Unexpected external call')}
test('disabled, unconfirmed or incomplete configuration refuses AI calls',async()=>{
  assert.equal((await handleAiRequest(request(),{...env(),AI_ENABLED:'false'},never)).status,503)
  const unconfirmed=await handleAiRequest(request(),{...env(),GROQ_FREE_TIER_CONFIRMED:'false'},never)
  assert.equal((await unconfirmed.json()).error,'free_tier_confirmation_required')
  assert.equal((await handleAiRequest(request(),{...env(),RATE_LIMITER:undefined},never)).status,503)
})
test('origin and auth are separate requirements',async()=>{
  assert.equal((await handleAiRequest(request(undefined,{Origin:'https://other.example.invalid'}),env(),never)).status,403)
  assert.equal((await handleAiRequest(request(undefined,{Authorization:'Bearer wrong'}),env(),never)).status,401)
})
test('preflight does not call provider and Worker context is not used as fetcher',async()=>{
  const r=new Request('https://api.example.invalid/ingredients',{method:'OPTIONS',headers:{Origin:origin}})
  const response=await worker.fetch(r,env(),{waitUntil:()=>{}})
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
test('only Groq receives request with strict schema and no provider secrets are returned',async()=>{
  let sent,calls=0
  const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer server-only-secret');sent=JSON.parse(options.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({version:1,foodKey:input().foodKey,ingredients:[{name:'Cibule',basis:'typical'}],needsReview:true})}}]})}
  const response=await handleAiRequest(request(),env(),fetcher)
  assert.equal(response.status,200);assert.equal(calls,1)
  assert.equal(sent.model,'openai/gpt-oss-20b')
  assert.equal(sent.response_format.json_schema.strict,true)
  assert.deepEqual(JSON.parse(sent.messages[1].content),input())
  assert.equal(sent.stream,false)
  const text=await response.text();assert.ok(!text.includes('server-only-secret'));assert.equal(JSON.parse(text).needsReview,true)
})
test('Groq quota exhaustion is returned without retries or a paid fallback',async()=>{
  let calls=0
  const response=await handleAiRequest(request(),env(),async()=>{calls++;return new Response('quota',{status:429})})
  assert.equal(response.status,429);assert.equal(calls,1)
  assert.equal((await response.json()).error,'groq_free_quota_exhausted')
})
test('provider errors and invalid proposals never leak upstream text',async()=>{
  const failed=await handleAiRequest(request(),env(),async()=>new Response('sensitive upstream body',{status:500}))
  assert.equal(failed.status,502);assert.ok(!(await failed.text()).includes('sensitive'))
  const invalid=await handleAiRequest(request(),env(),async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]}))
  assert.equal(invalid.status,502)
  const truncated=await handleAiRequest(request(),env(),async()=>Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]}))
  assert.equal(truncated.status,502)
})
