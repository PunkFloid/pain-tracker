import { AI_INGREDIENTS_INSTRUCTIONS, aiIngredientRequestKey, parseAiIngredientProposal } from '../src/ai-ingredients.mjs'
const MODEL='openai/gpt-oss-20b'
const schema={type:'object',additionalProperties:false,required:['version','foodKey','ingredients','needsReview'],properties:{version:{type:'integer',enum:[1]},foodKey:{type:'string'},ingredients:{type:'array',items:{type:'object',additionalProperties:false,required:['name','basis'],properties:{name:{type:'string'},basis:{type:'string',enum:['named','typical']}}}},needsReview:{type:'boolean'}}}
async function limitedText(message,limit){
  if(!message.body)return ''
  const reader=message.body.getReader(),decoder=new TextDecoder();let length=0,text=''
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new Error('size')}text+=decoder.decode(value,{stream:true})}return text+decoder.decode()}finally{reader.releaseLock()}
}
async function validToken(header,secret){
  if(typeof secret!=='string'||secret.length<32||typeof header!=='string'||header.length>1024)return false
  const digest=s=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))
  const [a,b]=await Promise.all([digest(header),digest('Bearer '+secret)])
  const left=new Uint8Array(a),right=new Uint8Array(b);let mismatch=0
  for(let i=0;i<left.length;i++)mismatch|=left[i]^right[i]
  return mismatch===0
}
export async function handleAiRequest(request,env,fetcher=fetch){
  const origin=request.headers.get('Origin'),allowed=env.ALLOWED_ORIGIN
  const cors=origin&&origin===allowed?{'Access-Control-Allow-Origin':allowed,'Vary':'Origin'}:{}
  const reply=(status,error)=>Response.json({error},{status,headers:{...cors,'Cache-Control':'no-store'}})
  if(new URL(request.url).pathname!=='/ingredients')return reply(404,'not_found')
  if(env.AI_ENABLED!=='true')return reply(503,'ai_disabled')
  if(env.GROQ_FREE_TIER_CONFIRMED!=='true')return reply(503,'free_tier_confirmation_required')
  if(!allowed||typeof env.GROQ_API_KEY!=='string'||!env.GROQ_API_KEY||typeof env.APP_AUTH_TOKEN!=='string'||env.APP_AUTH_TOKEN.length<32||typeof env.RATE_LIMITER?.limit!=='function')return reply(503,'configuration_required')
  if(origin!==allowed)return reply(403,'origin_denied')
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'}})
  if(request.method!=='POST')return reply(405,'method_not_allowed')
  if(!await validToken(request.headers.get('Authorization'),env.APP_AUTH_TOKEN))return reply(401,'unauthorized')
  if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')return reply(415,'json_required')
  let input
  try{input=JSON.parse(await limitedText(request,24000));aiIngredientRequestKey(input)}catch{return reply(400,'invalid_request')}
  try{const {success}=await env.RATE_LIMITER.limit({key:'personal-ingredient-api'});if(!success)return reply(429,'rate_limited')}catch{return reply(503,'limiter_unavailable')}
  let data
  try{
    const upstream=await fetcher('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+env.GROQ_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,messages:[{role:'system',content:AI_INGREDIENTS_INSTRUCTIONS},{role:'user',content:JSON.stringify(input)}],max_completion_tokens:1600,stream:false,response_format:{type:'json_schema',json_schema:{name:'ingredient_proposal',strict:true,schema}}}),signal:AbortSignal.timeout(20000)})
    if(upstream.status===429)return reply(429,'groq_free_quota_exhausted')
    if(!upstream.ok)return reply(502,'provider_error')
    data=JSON.parse(await limitedText(upstream,200000))
  }catch{return reply(502,'provider_unavailable')}
  try{
    const choice=data.choices?.[0]
    if(choice?.message?.refusal)return reply(422,'proposal_refused')
    if(choice?.finish_reason!=='stop'||typeof choice.message?.content!=='string')return reply(502,'incomplete_proposal')
    const proposal=parseAiIngredientProposal(choice.message.content,input)
    const result={version:1,foodKey:proposal.foodKey,ingredients:proposal.ingredients.map(({name,basis})=>({name,basis})),needsReview:proposal.needsReview}
    return Response.json(result,{headers:{...cors,'Cache-Control':'no-store'}})
  }catch{return reply(502,'invalid_provider_proposal')}
}
export default {fetch:(request,env)=>handleAiRequest(request,env)}
