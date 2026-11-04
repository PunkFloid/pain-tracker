import {test} from 'node:test'
import assert from 'node:assert/strict'
import {relation,windowReport} from '../src/time-analysis.mjs'
process.env.TZ='UTC'
const onset='2026-11-04T12:00:00Z'
const t=Date.parse(onset), h=3600000
const slot=(day,category,items=[{name:'Test',amount:'1 x porce',kcal:100,ingredients:[]}])=>({key:day+'|'+category,day,category,expected:100,items})
test('containment, partial overlap and no overlap',()=>{
 assert.equal(relation(t-20*h,t-18*h,t-24*h,t),'inside')
 assert.equal(relation(t-26*h,t-22*h,t-24*h,t),'possible')
 assert.equal(relation(t,t+2*h,t-24*h,t),'none')
 assert.equal(relation(t-26*h,t-25*h,t-24*h,t),'none')
 assert.equal(relation(t-2*h,t,t-24*h,t),'possible')
})
test('one meal crossing 24h is possible in both windows',()=>{
 const s=slot('2026-11-03','Oběd')
 const newer=windowReport([s],onset,24,0),older=windowReport([s],onset,48,24)
 assert.equal(newer.rows.length,1);assert.equal(older.rows.length,1)
 assert.equal(newer.rows[0].status,'possible');assert.equal(older.rows[0].status,'possible')
})
test('empty imported category is not a consumed meal',()=>{
 const r=windowReport([slot('2026-11-04','Snídaně',[])],onset,24,0)
 assert.equal(r.rows.length,0);assert.equal(r.imported,1);assert.ok(r.missing.length>0)
})
test('unimported dates never imply absence',()=>{
 const r=windowReport([],onset,48,24);assert.equal(r.rows.length,0);assert.equal(r.imported,0);assert.ok(r.expected>0)
})
test('DST window is still 24 real hours',()=>{
 const r=windowReport([],'2026-10-25T12:00:00+01:00',24,0)
 assert.equal(r.high-r.low,24*h)
})
