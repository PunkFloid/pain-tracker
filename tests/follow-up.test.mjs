import {test} from 'node:test'
import assert from 'node:assert/strict'
import {followUp} from '../src/follow-up.mjs'
process.env.TZ='UTC'
const now=Date.parse('2026-11-10T12:00:00Z'),zone='UTC'
const item=(name='Banán',ingredients=[])=>({name,amount:'1 x kus',kcal:100,ingredients})
const slot=(day='2026-11-01',category='Snídaně',items=[item()])=>({key:day+'|'+category,day,category,items,expected:100})
const checks=()=>Array.from({length:9},(_,i)=>({version:2,day:`2026-11-${String(i+1).padStart(2,'0')}`,headache:'none',food:'auto',foodSignature:'',zone}))
const run=(s=[slot()],p=[],c=checks(),time=now,kind='food')=>followUp(s,p,c,kind,zone,time)[0]
test('completed explicit period is free',()=>assert.equal(run().free,1))
test('tracked dates default free without daily clicks',()=>assert.equal(run([slot()],[],[]).free,1))
test('waits 48 hours after latest meal time',()=>{assert.equal(run([slot()],[],checks(),Date.parse('2026-11-03T09:59:59Z')).running,1);assert.equal(run([slot()],[],checks(),Date.parse('2026-11-04T00:01:00Z')).free,1)})
test('ongoing pain is marked as already present',()=>{const r=run([slot()],[{id:'p',start:'2026-10-31T12:00:00Z',end:'2026-11-02T12:00:00Z'}]);assert.equal(r.pain,1);assert.equal(r.groups[0].painBefore,true)})
test('pain overrides free defaults and explicit checks',()=>{const r=run([slot()],[{id:'p',start:'2026-11-02T12:00:00Z',end:'2026-11-02T13:00:00Z'}]);assert.equal(r.pain,1);assert.equal(r.free,0)})
test('consecutive consumption windows merge',()=>{const r=run([slot(),slot('2026-11-02')]);assert.equal(r.occasions,2);assert.equal(r.groups.length,1);assert.equal(r.free,1)})
test('separated windows stay separate',()=>{const r=run([slot(),slot('2026-11-05')]);assert.equal(r.groups.length,2);assert.equal(r.free,2)})
test('duplicate amounts do not add occasions',()=>{const r=run([slot('2026-11-01','Snídaně',[item(),item(' banán ')])]);assert.equal(r.occasions,1);assert.equal(r.groups[0].exposures[0].amounts.length,2)})
test('ingredient view uses explicit recipe ingredients',()=>{const r=run([slot('2026-11-01','Snídaně',[item('Recept',[{name:'Vejce',amount:'1 x kus'}])])],[],checks(),now,'ingredient');assert.equal(r.name,'Vejce');assert.equal(r.free,1)})
test('timezone metadata does not invalidate day overrides',()=>assert.equal(run([slot()],[],checks().map(c=>({...c,zone:'Europe/Prague'}))).free,1))
test('positive day without episode remains unknown',()=>{const c=checks();c[1].headache='pain';assert.equal(run([slot()],[],c).unknown,1)})
test('pain at exclusive end does not contaminate the elapsed window',()=>{const r=run([slot()],[{id:'p',start:'2026-11-03T10:00:00Z',end:'2026-11-03T11:00:00Z'}]);assert.equal(r.pain,0);assert.equal(r.free,1)})
test('manual unknown overrides default-free window',()=>{const c=checks();c[1].headache='unknown';assert.equal(run([slot()],[],c).unknown,1)})
test('pre-cutoff and tracked exposures stay separate',()=>{const r=run([slot('2026-10-28'),slot('2026-10-29')],[],[]);assert.equal(r.groups.length,2);assert.equal(r.unknown,1);assert.equal(r.free,1)})
test('elapsed interval may finish today, pending one still runs',()=>{const time=Date.parse('2026-11-04T21:40:00Z');assert.equal(run([slot('2026-11-02')],[],[],time).free,1);assert.equal(run([slot('2026-11-04')],[],[],time).running,1)})
