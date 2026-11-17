import { createAiIngredientRequest, aiIngredientRequestKey, parseAiIngredientProposal } from './ai-ingredients.mjs'
import { ingredientKey, automaticIngredients } from './ingredient-rules.mjs'
const KEY = 'pain-tracker-ai-ingredient-cache'
const defaultStorage = () => typeof localStorage === 'undefined' ? undefined : localStorage
function validateEntry(entry, key) {
  if (!entry || !entry.request || !entry.response || typeof entry.createdAt !== 'string' || !Number.isFinite(Date.parse(entry.createdAt))) throw new Error('Neplatný uložený AI návrh.')
  if (aiIngredientRequestKey(entry.request) !== key) throw new Error('Nesouhlasí klíč uloženého AI návrhu.')
  return parseAiIngredientProposal(entry.response, entry.request)
}
export function readAiIngredientCache(storage = defaultStorage()) {
  const raw = storage?.getItem(KEY) ?? null
  if (raw === null) return {version:1,items:{}}
  if (raw.length > 2000000) throw new Error('Úložiště AI návrhů je příliš velké.')
  const data = JSON.parse(raw)
  if (!data || data.version !== 1 || !data.items || typeof data.items !== 'object' || Array.isArray(data.items) || Object.keys(data.items).length > 250) throw new Error('Neplatné úložiště AI návrhů.')
  for (const [key,entry] of Object.entries(data.items)) validateEntry(entry,key)
  return data
}
export function saveAiIngredientProposal(request, input, storage = defaultStorage(), now = new Date().toISOString()) {
  if (!storage) throw new Error('Lokální úložiště není dostupné.')
  if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) throw new Error('Neplatný čas uložení.')
  const proposal = parseAiIngredientProposal(input,request)
  const key = aiIngredientRequestKey(request)
  const cleanRequest = createAiIngredientRequest({name:request.foodName,ingredients:request.knownIngredients.map(name=>({name}))})
  const response = {version:1,foodKey:cleanRequest.foodKey,ingredients:proposal.ingredients.map(({name,basis})=>({name,basis})),needsReview:proposal.needsReview}
  const data = readAiIngredientCache(storage)
  const next = {version:1,items:{...data.items,[key]:{request:cleanRequest,response,createdAt:now}}}
  const serialized = JSON.stringify(next)
  if (Object.keys(next.items).length > 250 || serialized.length > 2000000) throw new Error('Úložiště AI návrhů je plné; původní návrhy nebyly odstraněny.')
  storage.setItem(KEY,serialized)
  return proposal
}
export function cachedAiIngredientProposal(item, cache) {
  const request = createAiIngredientRequest(item), key = aiIngredientRequestKey(request)
  const entry = cache.items[key]
  return entry ? validateEntry(entry,key) : null
}
export function selectAiIngredientFallback(item, rules, cache) {
  const rule = rules.items[ingredientKey(item.name)]
  if (rule?.mode === 'manual' || rule?.mode === 'off' || item.ingredients?.length || automaticIngredients(item.name).length) return null
  const proposal = cachedAiIngredientProposal(item,cache)
  return proposal && !proposal.needsReview && proposal.ingredients.length ? proposal : null
}
