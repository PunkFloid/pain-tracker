import { createAiIngredientRequest, parseAiIngredientProposal } from './ai-ingredients.mjs'
import { readAiIngredientCache, cachedAiIngredientProposal, saveAiIngredientProposal } from './ai-ingredient-cache.mjs'
export const AI_INGREDIENT_ENDPOINT='https://pain-tracker-ai.fici.workers.dev/ingredients'
const messages={ai_disabled:'AI server je zatím vypnutý.',free_tier_confirmation_required:'Na serveru není potvrzený Free tarif.',configuration_required:'Server ještě nemá dokončené nastavení.',unauthorized:'Nesouhlasí APP_AUTH_TOKEN. Nepoužívej zde klíč Groq.',origin_denied:'Server nepovoluje adresu této aplikace.',groq_free_quota_exhausted:'Bezplatná kvóta Groq je vyčerpaná. Zkus to později; automaticky se neopakuje.',rate_limited:'Příliš mnoho požadavků. Zkus to později.',provider_error:'Groq odmítl požadavek. Je nutné zkontrolovat server.',provider_unavailable:'Groq je nedostupný nebo vypršel čas.',incomplete_proposal:'AI nevrátila úplnou odpověď.',invalid_provider_proposal:'AI odpověď nemá platný formát.',proposal_refused:'AI pro toto jídlo návrh odmítla.'}
async function readBody(response){
  if(!response.body)throw new Error('Prázdná odpověď serveru.')
  const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,text=''
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>50000){await reader.cancel();throw new Error('Odpověď serveru je příliš velká.')}text+=decoder.decode(value,{stream:true})}return text+decoder.decode()}finally{reader.releaseLock()}
}
export async function requestAiIngredientProposal(item,token,{storage,fetcher=fetch,signal}={}){
  const request=createAiIngredientRequest(item)
  const cached=cachedAiIngredientProposal(item,readAiIngredientCache(storage))
  if(cached)return {proposal:cached,fromCache:true}
  if(typeof token!=='string'||token.trim().length<32||token.trim().length>512||/[\r\n]/u.test(token))throw new Error('Zadej platný APP_AUTH_TOKEN, nikoli klíč Groq.')
  const body=JSON.stringify(request)
  if(new TextEncoder().encode(body).length>24000)throw new Error('Požadavek je příliš velký.')
  const controller=new AbortController(),abort=()=>controller.abort()
  if(signal?.aborted)throw new Error('Požadavek byl zrušen.')
  signal?.addEventListener('abort',abort,{once:true})
  const timer=setTimeout(abort,25000)
  try{
    let response
    try{response=await fetcher(AI_INGREDIENT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token.trim()},body,credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal})}catch{throw new Error(controller.signal.aborted?'Požadavek byl zrušen nebo vypršel čas.':'Server není dostupný. Zkontroluj připojení, zapnutí Production URL a nastavení Cloudflare.')}
    let data
    try{data=JSON.parse(await readBody(response))}catch{throw new Error('Server nevrátil platnou JSON odpověď.')}
    if(!response.ok)throw new Error(messages[data?.error]??('AI požadavek selhal (HTTP '+response.status+').'))
    parseAiIngredientProposal(data,request)
    if(controller.signal.aborted)throw new Error('Požadavek byl zrušen nebo vypršel čas.')
    const proposal=saveAiIngredientProposal(request,data,storage)
    return {proposal,fromCache:false}
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
