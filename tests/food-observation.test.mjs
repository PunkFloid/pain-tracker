import {test} from 'node:test'
import assert from 'node:assert/strict'
import {foodFollowUp} from '../src/food-follow-up.mjs'
process.env.TZ='UTC'
const now=Date.parse('2026-11-10T12:00:00Z')
const item=(name='Banán')=>({name,amount:'1 kus',kcal:100,ingredients:[{name:'Surovina',amount:'1 kus'}]})
const slot=(day,name='Banán')=>({key:day+'|Snídaně',day,category:'Snídaně',items:[item(name)],expected:100})
const run=(slots,checks=[],pains=[],meds=[],time=now,kind='food')=>foodFollowUp(slots,pains,checks,meds,kind,'UTC',time)
const check=(day,headache)=>({version:2,day,headache,food:'auto'})
test('historical unobserved items disappear instead of counting as unknown',()=>assert.deepEqual(run([slot('2026-10-28')]),[]))
test('old consumption crossing into tracked dates is not rescued',()=>assert.deepEqual(run([slot('2026-10-28'),slot('2026-10-29')]).map(r=>({n:r.occasions,free:r.free})),[{n:1,free:1}]))
test('excluded-only food disappears and shared food keeps only observed consumptions',()=>{const r=run([slot('2026-10-20','Staré jídlo'),slot('2026-10-21'),slot('2026-11-01')]);assert.equal(r.length,1);assert.equal(r[0].name,'Banán');assert.equal(r[0].occasions,1);assert.equal(r[0].days,1)})
test('explicitly covered historical days can be evaluated',()=>{const checks=['2026-10-26','2026-10-27','2026-10-28'].map(d=>check(d,'none'));const r=run([slot('2026-10-26')],checks);assert.equal(r[0].free,1)})
test('unknown origin date excludes consumption',()=>assert.deepEqual(run([slot('2026-11-01')],[check('2026-11-01','unknown')]),[]))
test('unknown day inside elapsed follow-up excludes consumption',()=>assert.deepEqual(run([slot('2026-11-01')],[check('2026-11-02','unknown')]),[]))
test('unlocated manual pain is not adequate observation',()=>assert.deepEqual(run([slot('2026-11-01')],[check('2026-11-02','pain')]),[]))
test('known pain does not rescue another unobserved follow-up day',()=>{const p={id:'p',start:'2026-11-02T12:00:00Z',end:'2026-11-02T13:00:00Z'};const m={painId:'p',at:'2026-11-02T12:30:00Z',count:1};assert.deepEqual(run([slot('2026-11-01')],[check('2026-11-03','unknown')],[p],[m]),[])})
test('recent known consumption remains running rather than disappearing',()=>{const r=run([slot('2026-11-10')]);assert.equal(r[0].running,1);assert.equal(r[0].occasions,1)})
test('future consumption is not counted',()=>assert.deepEqual(run([slot('2026-11-11')]),[]))
test('ingredient view excludes the same unobserved consumptions',()=>{const r=run([slot('2026-10-20'),slot('2026-11-01')],[],[],[],now,'ingredient');assert.equal(r[0].name,'Surovina');assert.equal(r[0].occasions,1)})
test('input food and pain records are never mutated',()=>{const slots=[slot('2026-10-28'),slot('2026-11-01')],before=JSON.stringify(slots);run(slots);assert.equal(JSON.stringify(slots),before)})
