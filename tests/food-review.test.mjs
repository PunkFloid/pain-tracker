import {test} from 'node:test'
import assert from 'node:assert/strict'
import {parseFoodReviews,parseDeferred,readFoodReviews,writeFoodReview,episodeIds} from '../src/food-review.mjs'
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
test('missing reviews start empty',()=>assert.deepEqual(parseFoodReviews(null),{version:1,items:{}}))
test('one pain shared by many consumptions is one episode',()=>assert.deepEqual(episodeIds({groups:[{status:'pain',painIds:['p']},{status:'pain',painIds:['p','q']},{status:'free',painIds:[]}]}),['p','q']))
test('manual status and note survive reload and can be reversed',()=>{const s=storage();writeFoodReview('food|a',{status:'ok',note:'test'},s);assert.equal(readFoodReviews(s).items['food|a'].status,'ok');writeFoodReview('food|a',{status:'watch'},s);assert.equal(readFoodReviews(s).items['food|a'].note,'test')})
test('new writes preserve other entries and notes need not assign a group',()=>{const s=storage();writeFoodReview('food|a',{note:'later'},s);writeFoodReview('ingredient|a',{status:'suspect'},s);const r=readFoodReviews(s);assert.equal(r.items['food|a'].status,undefined);assert.equal(r.items['food|a'].note,'later');assert.equal(r.items['ingredient|a'].status,'suspect')})
test('legacy deferred list is not reclassified or overwritten',()=>{const s=storage();s.setItem('pain-tracker-deferred','["food|a"]');writeFoodReview('food|a',{status:'watch'},s);assert.deepEqual(parseDeferred(s.getItem('pain-tracker-deferred')),['food|a'])})
test('invalid or unsupported stored data stops writes',()=>{const s=storage();s.setItem('pain-tracker-food-reviews','{"version":2,"items":{}}');assert.throws(()=>writeFoodReview('food|a',{status:'ok'},s));assert.equal(s.getItem('pain-tracker-food-reviews'),'{"version":2,"items":{}}');assert.throws(()=>parseDeferred('{}'))})
test('failed persistence does not report a saved result',()=>assert.throws(()=>writeFoodReview('food|a',{status:'ok'},{getItem:()=>null,setItem:()=>{throw new Error('quota')}})))
