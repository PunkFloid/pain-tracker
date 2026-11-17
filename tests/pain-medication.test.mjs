import {test} from 'node:test'
import assert from 'node:assert/strict'
import {medicationsForPain,painMedicationStatus} from '../src/pain-medication.mjs'
import {foodFollowUp} from '../src/food-follow-up.mjs'
process.env.TZ='UTC'
const now=Date.parse('2026-11-10T12:00:00Z')
const pain={id:'p',start:'2026-11-02T12:00:00Z',end:'2026-11-02T14:00:00Z',intensity:6,note:''}
const med={id:'m',at:'2026-11-02T13:00:00Z',name:'Panadol',count:2,painId:null,strength:'',note:''}
const slot={key:'2026-11-01|Snídaně',day:'2026-11-01',category:'Snídaně',items:[{name:'Banán',amount:'1 kus',kcal:100,ingredients:[]}],expected:100}
const run=(pains=[pain],meds=[])=>foodFollowUp([slot],pains,[],meds,'food','UTC',now)[0]
test('unassigned medicine during pain counts once',()=>{assert.equal(medicationsForPain(pain,[med],now).length,1);assert.equal(painMedicationStatus(pain,[med],now),'treated')})
test('explicit link has priority over time and is not double counted',()=>{assert.equal(medicationsForPain(pain,[{...med,painId:'p'}],now).length,1);assert.equal(painMedicationStatus(pain,[{...med,painId:'p',at:'2026-11-03T00:00:00Z'}],now),'treated')})
test('medicine assigned to another pain is not inferred by time',()=>assert.equal(painMedicationStatus(pain,[{...med,painId:'other'}],now),'untreated'))
test('outside time and future medicine do not count',()=>{assert.equal(painMedicationStatus(pain,[{...med,at:'2026-11-02T15:00:00Z'}],now),'untreated');assert.equal(painMedicationStatus(pain,[{...med,painId:'p',at:'2026-11-11T00:00:00Z'}],now),'untreated')})
test('completed untreated pain is free only in food analysis',()=>{const r=run();assert.equal(r.free,1);assert.equal(r.pain,0);assert.equal(pain.intensity,6)})
test('treated pain gives pain result',()=>{const r=run([pain],[med]);assert.equal(r.pain,1);assert.deepEqual(r.groups[0].painIds,['p'])})
test('ongoing untreated pain remains pending, even after meal window elapsed',()=>{const r=run([{...pain,end:null}]);assert.equal(r.running,1);assert.equal(r.free,0)})
test('removing medicine dynamically changes food result',()=>{assert.equal(run([pain],[med]).pain,1);assert.equal(run([pain],[]).free,1)})
test('per-consumption totals remain consistent',()=>{const r=run([pain],[med]);assert.equal(r.occasions,r.pain+r.free+r.running+r.unknown)})
