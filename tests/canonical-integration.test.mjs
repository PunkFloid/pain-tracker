import test from 'node:test'
import assert from 'node:assert/strict'
import { trackedIdentity } from '../src/naming-rules.mjs'
import { ingredientSlots } from '../src/ingredient-resolution.mjs'
import { followUp } from '../src/follow-up.mjs'
import { canonicalReviewId } from '../src/ingredient-review-migration.mjs'
import { readFoodReviews, writeFoodReview, parseDeferred } from '../src/food-review.mjs'
const raw = n => 'ingredient|' + JSON.stringify(['raw',n])
function storage(items) {
  const data=new Map([['pain-tracker-food-reviews',JSON.stringify({version:1,items})]])
  return { getItem:k=>data.get(k)??null, setItem:(k,v)=>data.set(k,v) }
}
test('resolved IDs are used by statistics and match canonical review IDs',()=>{
  const items=['Gouda','Mozzarella'].map(name=>({name,amount:'20 g',kcal:50,ingredients:[]}))
  const slots=ingredientSlots([{key:'2026-11-01|Snídaně',day:'2026-11-01',category:'Snídaně',items}])
  const before=JSON.stringify(slots)
  const rows=followUp(slots,[],[],'ingredient','UTC',Date.parse('2026-11-10T12:00:00Z'))
  assert.equal(rows.length,1)
  assert.equal(rows[0].occasions,1)
  assert.equal('ingredient|'+rows[0].key,canonicalReviewId('ingredient:cheese'))
  assert.equal(JSON.stringify(slots),before)
})
test('ordinary foods and custom groups retain their identities',()=>{
  assert.equal(trackedIdentity({name:'Kaše'}).key,JSON.stringify(['raw','kaše']))
  assert.equal(trackedIdentity({name:'Směs',tracking:{version:1,id:'mix',label:'Mix'}}).key,JSON.stringify(['group',1,'mix']))
})
test('read overlays migration without storage writes and later saves preserve originals',()=>{
  const old={status:'ok',note:'Historie',updatedAt:'2026-11-17T10:00:00Z'}
  const s=storage({[raw('sýr')]:old})
  const before=s.getItem('pain-tracker-food-reviews')
  const target=canonicalReviewId('ingredient:cheese')
  assert.equal(readFoodReviews(s).items[target].status,'ok')
  assert.equal(s.getItem('pain-tracker-food-reviews'),before)
  writeFoodReview(target,{status:'suspect'},s)
  assert.equal(readFoodReviews(s).items[target].status,'suspect')
  assert.deepEqual(readFoodReviews(s).items[raw('sýr')],old)
})
test('deferred aliases remain parked after identity conversion',()=>{
  const old=raw('sýr')
  const result=parseDeferred(JSON.stringify([old,'food|a']))
  assert.ok(result.includes(old))
  assert.ok(result.includes(canonicalReviewId('ingredient:cheese')))
  assert.ok(result.includes('food|a'))
})
