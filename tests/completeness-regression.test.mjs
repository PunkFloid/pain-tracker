import {test} from 'node:test'
import assert from 'node:assert/strict'
import {foodSnapshot,validateCheck,assessCheck} from '../src/day-check-logic.mjs'
import {windowReport} from '../src/time-analysis.mjs'
import {foodStatistics} from '../src/food-statistics.mjs'
process.env.TZ='UTC'
const day='2026-11-03',zone='UTC',now=new Date('2026-11-05T12:00:00Z')
const item={name:'Banán',amount:'1 x kus',kcal:100,ingredients:[]}
const slots=(d=day)=>['Snídaně','Oběd','Večeře'].map(category=>({key:d+'|'+category,day:d,category,items:[item],expected:100}))
const record=s=>({version:2,day,headache:'none',food:'complete',foodSignature:foodSnapshot(day,s).signature,zone})
test('three meals are sufficient for complete confirmation',()=>{const s=slots();assert.deepEqual(validateCheck(record(s),[],s,now),[]);assert.equal(assessCheck(day,record(s),[],s,zone,now).food,'complete')})
test('one meal may be complete',()=>{const s=slots().slice(0,1);assert.deepEqual(validateCheck(record(s),[],s,now),[]);assert.equal(assessCheck(day,record(s),[],s,zone,now).food,'complete')})
test('explicitly complete empty day is allowed; no import alone is not complete',()=>{assert.deepEqual(validateCheck(record([]),[],[],now),[]);assert.equal(assessCheck(day,record([]),[],[],zone,now).food,'complete');assert.equal(assessCheck(day,null,[],[],zone,now).food,'unconfirmed')})
test('calendar-day coverage does not require snacks',()=>{const r=windowReport([...slots(),...slots('2026-11-04')],'2026-11-04T12:00:00Z',24,0);assert.equal(r.expected,2);assert.equal(r.imported,2);assert.equal(r.missing.length,0)})
test('statistics do not exclude three-meal days',()=>{const r=foodStatistics([...slots(),...slots('2026-11-04')],[{id:'p',start:'2026-11-04T12:00:00Z'}],'food',24,0);assert.equal(r.eligible,1);assert.equal(r.incomplete,0);assert.equal(r.rows[0].total,1)})
test('absent date remains without import',()=>assert.deepEqual(windowReport(slots(),'2026-11-04T12:00:00Z',24,0).missing,['2026-11-04']))
test('midnight boundary excludes next day',()=>{const r=windowReport(slots(),'2026-11-04T00:00:00Z',24,0);assert.equal(r.expected,1);assert.equal(r.imported,1)})
test('imported completeness is automatic and manual incomplete has priority',()=>{const s=slots();assert.equal(assessCheck(day,null,[],s,zone,now).food,'complete');assert.equal(assessCheck(day,{...record(s),food:'incomplete'},[],s,zone,now).food,'incomplete')})
