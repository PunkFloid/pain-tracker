import {test} from 'node:test'
import assert from 'node:assert/strict'
import {followUp} from '../src/follow-up.mjs'
process.env.TZ='UTC'
const now=Date.parse('2026-11-10T12:00:00Z'),zone='UTC'
const item=(name='Banán',ingredients=[])=>({name,amount:'1 x kus',kcal:100,ingredients})
const slot=(day='2026-11-01',category='Snídaně',items=[item()])=>({key:day+'|'+category,day,category,items,expected:100})
const checks=()=>Array.from({length:9},(_,i)=>({day:`2026-11-${String(i+1).padStart(2,'0')}`,headache:'none',food:'unknown',foodSignature:'',zone}))
const run=(s=[slot()],p=[],c=checks(),time=now,kind='food')=>followUp(s,p,c,kind,zone,time)[0]
test('completed confirmed period is free',()=>{assert.equal(run().free,1)})
test('no checks never means pain-free',()=>{assert.equal(run([slot()],[],[]).unknown,1)})
test('waits 48 hours after latest meal time',()=>{assert.equal(run([slot()],[],checks(),Date.parse('2026-11-03T09:59:59Z')).running,1);assert.equal(run([slot()],[],checks(),Date.parse('2026-11-04T00:01:00Z')).free,1)})
test('ongoing pain is not attributed to a new onset after food',()=>{const r=run([slot()],[{id:'p',start:'2026-10-31T12:00:00Z',end:'2026-11-02T12:00:00Z'}]);assert.equal(r.pain,1);assert.equal(r.groups[0].painBefore,true)})
test('new pain overrides contradictory free confirmations',()=>{const r=run([slot()],[{id:'p',start:'2026-11-02T12:00:00Z',end:'2026-11-02T13:00:00Z'}]);assert.equal(r.pain,1);assert.equal(r.free,0)})
test('consecutive consumption windows merge into one group',()=>{const r=run([slot(),slot('2026-11-02')]);assert.equal(r.occasions,2);assert.equal(r.groups.length,1);assert.equal(r.free,1)})
test('separated windows stay separate',()=>{const r=run([slot(),slot('2026-11-05')]);assert.equal(r.groups.length,2);assert.equal(r.free,2)})
test('duplicate amounts in one category do not create extra occasions',()=>{const r=run([slot('2026-11-01','Snídaně',[item(),item(' banán ')])]);assert.equal(r.occasions,1);assert.equal(r.groups[0].exposures[0].amounts.length,2)})
test('ingredient view uses only explicit recipe ingredients',()=>{const s=[slot('2026-11-01','Snídaně',[item('Recept',[{name:'Vejce',amount:'1 x kus'}])])];const r=run(s,[],checks(),now,'ingredient');assert.equal(r.name,'Vejce');assert.equal(r.free,1)})
test('different timezone invalidates free confirmation',()=>{const c=checks().map(x=>({...x,zone:'Europe/Prague'}));assert.equal(run([slot()],[],c).unknown,1)})
test('positive check without episode remains unknown',()=>{const c=checks();c[1].headache='pain';assert.equal(run([slot()],[],c).unknown,1)})
test('pain exactly at exclusive end is outside',()=>{const r=run([slot()],[{id:'p',start:'2026-11-03T10:00:00Z',end:'2026-11-03T11:00:00Z'}]);assert.equal(r.pain,0);assert.equal(r.unknown,1)})
