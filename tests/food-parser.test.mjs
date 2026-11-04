import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLines, signature, tags } from '../src/food-parser.mjs'
const lines=['Pondělí 02.11.2026','Oběd 100 kcal','Testovací pokrm 1 x porce 100 kcal','vejce slepičí 0,5 x kus (55 g)','Aktivity']
test('recipe ingredients belong to one meal',()=>{const r=parseLines(lines);assert.equal(r.warnings.length,0);assert.equal(r.slots[0].items.length,1);assert.equal(r.slots[0].items[0].ingredients.length,1)})
test('duplicate signatures preserve multiplicity and amounts',()=>{const s=parseLines(lines).slots[0];assert.equal(signature(s),signature({...s,items:[...s.items].reverse()}));assert.notEqual(signature(s),signature({...s,items:[...s.items,...s.items]}));assert.notEqual(signature(s),signature({...s,items:s.items.map(x=>({...x,amount:'2 x porce'}))}))})
test('reject incomplete or duplicate categories and invalid dates',()=>{assert.ok(parseLines(['Oběd 100 kcal']).warnings.length);assert.ok(parseLines([...lines,...lines]).warnings.length);assert.ok(parseLines(['Pondělí 31.02.2026','Oběd']).warnings.length)})
test('unknown recipe is not an absence claim',()=>{assert.deepEqual(tags('Testovací pokrm'),[]);assert.deepEqual(tags('Smetana lactose free'),['mléčná složka','bez laktózy – dle názvu'])})
