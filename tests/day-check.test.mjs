import {test} from 'node:test'
import assert from 'node:assert/strict'
import {assessCheck,checkModes,dayBounds,foodSnapshot,localDay,painsInDay,previousDay,validateCheck} from '../src/day-check-logic.mjs'
process.env.TZ='UTC'
const now=new Date('2026-11-04T21:40:00Z'),zone='UTC',day='2026-11-03'
const slot=(d=day)=>({key:d+'|Oběd',day:d,category:'Oběd',items:[],expected:0})
const check=(headache='none',food='complete',d=day)=>({version:2,day:d,headache,food,foodSignature:foodSnapshot(d,[slot(d)]).signature,zone})
const state=(d=day,c=null,p=[],s=[])=>assessCheck(d,c,p,s,zone,now)
const pain=(start,end)=>({id:'p',start,end,intensity:5,note:''})
test('cutoff includes October 28 as no record',()=>{for(const d of ['2026-10-16','2026-10-27','2026-10-28'])assert.equal(state(d).headache,'unconfirmed')})
test('all six requested historical days default pain-free',()=>{for(const d of ['2026-10-29','2026-10-30','2026-10-31','2026-11-01','2026-11-02','2026-11-03'])assert.equal(state(d).headache,'assumed-free')})
test('today defaults free, future stays without record',()=>{assert.equal(state('2026-11-04').headache,'assumed-free');assert.equal(state('2026-11-05').headache,'unconfirmed')})
test('any imported day defaults complete without six categories',()=>{for(const d of ['2026-10-16',day])assert.equal(state(d,null,[],[slot(d)]).food,'complete');assert.equal(state().food,'unconfirmed')})
test('legacy unknown choices adopt automatic policy, explicit choices remain',()=>{assert.deepEqual(checkModes({...check(),version:1,headache:'unknown',food:'unknown'}),{headache:'auto',food:'auto'});assert.deepEqual(checkModes({...check('none','incomplete'),version:1}),{headache:'none',food:'incomplete'})})
test('explicit unknown and incomplete override automatic defaults',()=>{assert.equal(state(day,check('unknown','unknown'),[],[slot()]).headache,'unconfirmed');assert.equal(state(day,check('unknown','unknown'),[],[slot()]).food,'unconfirmed');assert.equal(state(day,check('auto','incomplete'),[],[slot()]).food,'incomplete')})
test('actual ongoing and multi-day pain overrides free state',()=>{for(const end of [null,'2026-11-04T10:00:00Z']){const p=pain('2026-11-02T22:00:00Z',end);assert.ok(validateCheck(check(),[p],[slot()],now).length);assert.equal(state(day,check(),[p]).headache,'recorded-pain');assert.equal(state(day,null,[p]).headache,'recorded-pain')}})
test('midnight end excludes next day; instant event still counts',()=>{assert.equal(painsInDay(day,[pain('2026-11-02T22:00:00Z','2026-11-03T00:00:00Z')]).length,0);assert.equal(painsInDay(day,[pain(day+'T00:00:00Z',day+'T00:00:00Z')]).length,1)})
test('explicit pain without episode requires time details',()=>{assert.equal(state(day,check('pain','auto')).headache,'needs-episode')})
test('current day edits allowed, future edits blocked',()=>{assert.deepEqual(validateCheck(check('auto','auto','2026-11-04'),[],[],now),[]);assert.ok(validateCheck(check('auto','auto','2026-11-05'),[],[],now).length)})
test('explicit completeness persists until changed by user',()=>{assert.equal(state(day,check(),[],[]).food,'complete');assert.equal(state(day,check(),[],[{...slot(),items:[{name:'Test',amount:'1 x kus',kcal:100,ingredients:[]}]}]).food,'complete')})
test('evaluation changes no existing record or food data',()=>{const s=[slot()],c=check('auto','auto'),before=JSON.stringify({s,c});state(day,c,[],s);assert.equal(JSON.stringify({s,c}),before)})
test('device timezone does not clear explicit choices',()=>{const a=assessCheck(day,check(),[],[slot()],'Europe/Prague',now);assert.equal(a.headache,'confirmed-free');assert.equal(a.food,'complete')})
test('date validation and calendar boundaries remain correct',()=>{assert.throws(()=>dayBounds('2026-02-31'));assert.equal(previousDay(now),day);assert.equal(localDay(now),'2026-11-04');process.env.TZ='Europe/Prague';const b=dayBounds('2026-10-25');assert.equal(b.end-b.start,25*3600000);process.env.TZ='UTC'})
