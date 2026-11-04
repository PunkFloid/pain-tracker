import {test} from 'node:test'
import assert from 'node:assert/strict'
import {foodStatistics} from '../src/food-statistics.mjs'
import {mealTimes} from '../src/food-parser.mjs'
process.env.TZ='UTC'
const pain={id:'p1',start:'2026-11-04T12:00:00Z'}
const item=(name,ingredients=[])=>({name,amount:'1 x porce',kcal:100,ingredients})
const slot=(day,category,items=[])=>({key:day+'|'+category,day,category,items,expected:null})
const complete=()=>['2026-11-03','2026-11-04'].flatMap(day=>Object.keys(mealTimes).map(c=>slot(day,c)))
test('multiple servings count once per episode, inside wins',()=>{
 const s=complete();s.find(x=>x.key==='2026-11-03|Oběd').items=[item('Banán')];s.find(x=>x.key==='2026-11-04|Snídaně').items=[item(' banán '),item('Banán')]
 const r=foodStatistics(s,[pain],'food',24,0);assert.equal(r.eligible,1);assert.equal(r.rows.length,1);assert.equal(r.rows[0].total,1);assert.equal(r.rows[0].inside,1);assert.equal(r.rows[0].possible,0);assert.equal(r.rows[0].days,2)
})
test('separate recipes do not duplicate ingredient per attack',()=>{
 const s=complete();s.find(x=>x.key==='2026-11-04|Snídaně').items=[item('Recept A',[{name:'Vejce',amount:'1 x kus'}]),item('Recept B',[{name:'vejce',amount:'2 x kus'}])]
 const r=foodStatistics(s,[pain],'ingredient',24,0);assert.equal(r.rows[0].total,1)
 assert.equal(foodStatistics(s,[pain],'food',24,0).rows.length,2)
})
test('incomplete import is excluded unless explicitly allowed',()=>{
 const s=[slot('2026-11-04','Snídaně',[item('Banán')])]
 const strict=foodStatistics(s,[pain],'food',24,0);assert.equal(strict.eligible,0);assert.equal(strict.incomplete,1)
 const partial=foodStatistics(s,[pain],'food',24,0,true);assert.equal(partial.eligible,1);assert.equal(partial.partial,1)
})
test('no import is never an evaluable no-exposure episode',()=>{
 const r=foodStatistics([],[pain],'food',24,0,true);assert.equal(r.eligible,0);assert.equal(r.noData,1);assert.equal(r.rows.length,0)
})
test('each distinct episode adds at most one hit',()=>{
 const s=complete();s.find(x=>x.key==='2026-11-04|Snídaně').items=[item('Banán')]
 const r=foodStatistics(s,[pain,{id:'p2',start:'2026-11-04T15:00:00Z'}],'food',24,0)
 assert.equal(r.rows[0].total,2);assert.equal(r.rows[0].days,1)
})
