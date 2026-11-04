import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mealTimes} from '../src/food-parser.mjs'
import {dayBounds,painsInDay,foodSnapshot,validateCheck,assessCheck,previousDay} from '../src/day-check-logic.mjs'
process.env.TZ='Europe/Prague'
const day='2026-11-03',zone='Europe/Prague',now=new Date('2026-11-04T18:00:00+01:00')
const slots=()=>Object.keys(mealTimes).map(category=>({key:day+'|'+category,day,category,items:[],expected:0}))
const check=(s=slots())=>({day,headache:'none',food:'complete',zone,foodSignature:foodSnapshot(day,s).signature})
const pain=(start,end)=>({id:'p',start,end,intensity:5,note:''})
test('missing checks do not imply a pain-free day',()=>{assert.equal(assessCheck(day,null,[],[],zone,now).headache,'unconfirmed')})
test('past free day can be confirmed explicitly',()=>{assert.deepEqual(validateCheck(check(),[],slots(),now),[]);assert.equal(assessCheck(day,check(),[],slots(),zone,now).headache,'confirmed-free');assert.equal(previousDay(now),day)})
test('today and future cannot be closed',()=>{assert.ok(validateCheck({...check(),day:'2026-11-04',food:'unknown'},[],[],now).length);assert.ok(validateCheck({...check(),day:'2026-11-05',food:'unknown'},[],[],now).length)})
test('ongoing and multi-day pain block free confirmation',()=>{for(const end of [null,'2026-11-04T10:00:00+01:00']){const p=pain('2026-11-02T22:00:00+01:00',end);assert.ok(validateCheck(check(),[p],slots(),now).length);assert.equal(assessCheck(day,check(),[p],slots(),zone,now).headache,'conflict')}})
test('end at midnight does not overlap next day; zero-duration event still counts',()=>{assert.equal(painsInDay(day,[pain('2026-11-02T22:00:00+01:00','2026-11-03T00:00:00+01:00')]).length,0);assert.equal(painsInDay(day,[pain('2026-11-03T00:00:00+01:00','2026-11-03T00:00:00+01:00')]).length,1)})
test('missing category blocks complete food confirmation',()=>{assert.ok(validateCheck(check(),[],slots().slice(1),now).length)})
test('changed food invalidates only food confirmation',()=>{const s=slots(),c=check(s);s[0].items=[{name:'Test',amount:'1 x kus',kcal:100,ingredients:[]}];const a=assessCheck(day,c,[],s,zone,now);assert.equal(a.food,'review');assert.equal(a.headache,'confirmed-free')})
test('pain without episode is retained but flagged for completion',()=>{assert.equal(assessCheck(day,{...check(),headache:'pain'},[],slots(),zone,now).headache,'needs-episode')})
test('timezone changes require reconfirmation',()=>{const a=assessCheck(day,check(),[],slots(),'America/New_York',now);assert.equal(a.headache,'review');assert.equal(a.food,'review')})
test('invalid dates rejected and DST day uses calendar midnight',()=>{assert.throws(()=>dayBounds('2026-02-31'));const b=dayBounds('2026-10-25');assert.equal(b.end-b.start,25*3600000)})
