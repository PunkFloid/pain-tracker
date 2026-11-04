import {test} from 'node:test'
import assert from 'node:assert/strict'
import {prepareNewDays,appendNewDays,trackedIdentity} from '../src/naming-rules.mjs'
const food=(name='vejce slepičí')=>({name,amount:'1 x kus',kcal:80,ingredients:[]})
const slot=(day='2026-11-01',category='Snídaně',items=[food()])=>({key:day+'|'+category,day,category,items,expected:80})
const rules=[{id:'vejce slepičí',source:'vejce slepičí',target:'Vejce'}]
test('stored history stays byte-for-byte unchanged',()=>{const old=[slot()];const before=JSON.stringify(old);const r=prepareNewDays([slot(),slot('2026-11-02')],old,rules);const merged=appendNewDays(old,r.fresh);assert.equal(JSON.stringify(old),before);assert.strictEqual(merged.slots[0],old[0]);assert.equal(old[0].items[0].tracking,undefined);assert.equal(r.skipped.length,1)})
test('new items keep original names and amounts',()=>{const r=prepareNewDays([slot('2026-11-02')],[slot()],rules).fresh[0];assert.equal(r.items[0].name,'vejce slepičí');assert.equal(r.items[0].amount,'1 x kus');assert.equal(r.items[0].tracking.label,'Vejce')})
test('recipe ingredients map without guessing parent composition',()=>{const parent=food('Recept');parent.ingredients=[food()];const s=prepareNewDays([slot('2026-11-02','Oběd',[parent])],[slot()],rules).fresh[0];assert.equal(s.items[0].tracking,undefined);assert.equal(s.items[0].ingredients[0].tracking.label,'Vejce')})
test('rule editing never changes a frozen imported identity',()=>{const item=prepareNewDays([slot()],[],rules).fresh[0].items[0];const before=trackedIdentity(item);rules[0].target='Jiná skupina';assert.deepEqual(trackedIdentity(item),before);rules[0].target='Vejce'})
test('canonical and raw names stay separate',()=>{const mapped=prepareNewDays([slot()],[],rules).fresh[0].items[0];assert.notEqual(trackedIdentity(mapped).key,trackedIdentity(food('Vejce')).key)})
test('all categories of an existing day are locked, even absent ones',()=>{const r=prepareNewDays([slot('2026-11-01','Večeře')],[slot()],rules);assert.equal(r.fresh.length,0);assert.equal(r.skipped.length,1)})
test('newly imported day is locked on the next import',()=>{const first=prepareNewDays([slot()],[],rules).fresh;assert.equal(prepareNewDays([slot()],first,rules).fresh.length,0)})
test('no rule does not create any group',()=>{const r=prepareNewDays([slot()],[],[]).fresh[0];assert.equal(r.items[0].tracking,undefined)})
test('exact matching does not merge lactose variants',()=>{const r=prepareNewDays([slot('2026-11-01','Snídaně',[food('mléko bez laktózy')])],[],[{id:'mléko',source:'mléko',target:'Mléko'}]);assert.equal(r.fresh[0].items[0].tracking,undefined)})
test('case and whitespace may match',()=>{const r=prepareNewDays([slot('2026-11-01','Snídaně',[food(' Vejce   SLEPIČÍ ')])],[],rules);assert.equal(r.fresh[0].items[0].tracking.label,'Vejce')})
test('append cannot overwrite historical amounts',()=>{const old=[slot()];const changed=slot();changed.items[0].amount='99 x kus';assert.deepEqual(appendNewDays(old,[changed]).slots,old)})
test('duplicate new category is rejected',()=>{assert.throws(()=>appendNewDays([],[slot(),slot()]))})
