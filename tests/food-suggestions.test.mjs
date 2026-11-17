import {test} from 'node:test'
import assert from 'node:assert/strict'
import {foodSuggestion,readSuggestionDecisions,dismissFoodSuggestion} from '../src/food-suggestions.mjs'
import {writeFoodReview,readFoodReviews} from '../src/food-review.mjs'
const now=Date.parse('2026-11-30T12:00:00Z')
function row(painCount=0){const groups=Array.from({length:10},(_,i)=>{const day=`2026-11-${String(i===9?15:i+1).padStart(2,'0')}`,from=Date.parse(day+'T06:00:00Z');return {from,until:from+48*3600000,status:i<painCount?'pain':'free',painBefore:false,painIds:i<painCount?['p'+i]:[],exposures:[{day,category:'Snídaně',from}]}});return {key:'a',name:'A',groups}}
const propose=(r,review)=>foodSuggestion(r,row(1).groups,review,[],now)
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}}
test('ten completed consumptions across fourteen days and ninety percent free qualify',()=>{const s=propose(row(1));assert.equal(s.type,'ok');assert.equal(s.completed,10);assert.equal(s.spanDays,14)})
test('nine completed consumptions do not qualify',()=>{const r=row();r.groups.pop();assert.equal(propose(r),null)})
test('pending windows do not increase completed count or change dismissal evidence',()=>{const r=row(),a=propose(r);r.groups.push({...r.groups[0],status:'running',until:now+1000});assert.equal(propose(r).fingerprint,a.fingerprint)})
test('three distinct episodes and excess over baseline qualify',()=>{assert.equal(propose(row(3)).type,'suspect');const r=row(3);r.groups.forEach(g=>{if(g.status==='pain')g.painIds=['same']});assert.equal(propose(r),null)})
test('no excess or no baseline means no suspect proposal',()=>{assert.equal(foodSuggestion(row(3),row(4).groups,undefined,[],now),null);assert.equal(foodSuggestion(row(3),[],undefined,[],now),null)})
test('pain already present at consumption is excluded from proposal evidence',()=>{const r=row(3);r.groups.filter(g=>g.status==='pain').forEach(g=>g.painBefore=true);assert.equal(propose(r),null)})
test('manual suspect remains untouched; ok needs a new episode to recheck',()=>{assert.equal(propose(row(3),{status:'suspect'}),null);assert.equal(propose(row(3),{status:'ok',acceptedPainIds:['p0','p1','p2']}),null);assert.equal(propose(row(4),{status:'ok',acceptedPainIds:['p0','p1','p2']}).type,'recheck')})
test('dismissal persists and different relevant episodes change the evidence',()=>{const s=storage(),a={...propose(row(3)),id:'food|a'};dismissFoodSuggestion(a,s);assert.equal(readSuggestionDecisions(s).items['food|a|suspect'],a.fingerprint);assert.notEqual(propose(row(4)).fingerprint,a.fingerprint)})
test('notes do not reset classification timestamp or accepted episode snapshot',()=>{const s=storage();writeFoodReview('food|a',{status:'ok',acceptedPainIds:['p0']},s);const before=readFoodReviews(s).items['food|a'];writeFoodReview('food|a',{note:'text'},s);const after=readFoodReviews(s).items['food|a'];assert.equal(after.statusChangedAt,before.statusChangedAt);assert.deepEqual(after.acceptedPainIds,['p0'])})
