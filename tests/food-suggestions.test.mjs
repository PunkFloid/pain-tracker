import {test} from 'node:test'
import assert from 'node:assert/strict'
import {foodSuggestion,readSuggestionDecisions,dismissFoodSuggestion,FOOD_RULES} from '../src/food-suggestions.mjs'
const now=Date.parse('2026-11-30T12:00:00Z')
function row(painCount=0,total=10){const groups=Array.from({length:total},(_,i)=>{const day=`2026-11-${String(i===9?15:i+1).padStart(2,'0')}`,from=Date.parse(day+'T06:00:00Z');return {from,until:from+48*3600000,status:i<painCount?'pain':'free',painBefore:false,painIds:i<painCount?['p'+i]:[],exposures:[{day,category:'Snídaně',from}]}});return {key:'a',name:'A',groups}}
const propose=(r,review)=>foodSuggestion(r,row(1).groups,review,[],now)
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}}
test('safe rule remains 10 completed, 14 days, 90 percent free',()=>{const s=propose(row(1));assert.equal(s.type,'ok');assert.equal(s.completed,10);assert.equal(s.spanDays,14)})
test('nine free observations do not meet safe rule',()=>assert.equal(propose(row(0,9)),null))
test('one of one qualifies without minimum episodes',()=>{const s=propose(row(1,1));assert.equal(s.type,'suspect');assert.equal(s.painRate,1);assert.equal('minEpisodes' in FOOD_RULES,false)})
test('two of three qualifies',()=>assert.equal(propose(row(2,3)).type,'suspect'))
test('exactly half does not qualify',()=>{assert.equal(propose(row(1,2)),null);assert.equal(propose(row(5,10)),null)})
test('six of ten qualifies and two of ten does not',()=>{assert.equal(propose(row(6)).type,'suspect');assert.equal(propose(row(2)),null)})
test('repeated association with same pain is not blocked',()=>{const r=row(2,3);r.groups.forEach(g=>{if(g.status==='pain')g.painIds=['same']});assert.equal(propose(r).type,'suspect');assert.equal(propose(r).episodeIds.length,1)})
test('baseline is context only, including absent or higher baseline',()=>{assert.equal(foodSuggestion(row(2,3),[],undefined,[],now).type,'suspect');assert.equal(foodSuggestion(row(2,3),row(10).groups,undefined,[],now).type,'suspect')})
test('pending and unknown windows do not dilute denominator',()=>{const r=row(1,1);r.groups.push({...r.groups[0],status:'running',until:now+1000},{...r.groups[0],status:'unknown'});assert.equal(propose(r).completed,1);assert.equal(propose(r).painRate,1)})
test('pain outcomes still need elapsed follow-up',()=>{const r=row(1,1);r.groups[0].until=now+1;assert.equal(propose(r),null)})
test('already ongoing pain is excluded',()=>{const r=row(1,1);r.groups[0].painBefore=true;assert.equal(propose(r),null)})
test('empty evidence has no proposal',()=>assert.equal(propose(row(0,0)),null))
test('manual suspect stays and ok needs new associated episode',()=>{assert.equal(propose(row(1,1),{status:'suspect'}),null);assert.equal(propose(row(1,1),{status:'ok',acceptedPainIds:['p0']}),null);assert.equal(propose(row(2,3),{status:'ok',acceptedPainIds:['p0']}).type,'recheck')})
test('dismissal survives reload',()=>{const s=storage(),a={...propose(row(1,1)),id:'food|a'};dismissFoodSuggestion(a,s);assert.equal(readSuggestionDecisions(s).items['food|a|suspect'],a.fingerprint)})
test('pending data does not resurface dismissal, completed denominator change does',()=>{const r=row(2,2),a=propose(r);r.groups.push({...row(0,1).groups[0],status:'running',until:now+1});assert.equal(propose(r).fingerprint,a.fingerprint);r.groups[r.groups.length-1]={...row(0,1).groups[0]};assert.notEqual(propose(r).fingerprint,a.fingerprint);assert.equal(propose(r).type,'suspect')})
