import { readData } from './db'
import { readFoodForChecks } from './day-check-store'
import type { DayCheckRecord } from './day-check-logic.mjs'
function readAllChecks():Promise<DayCheckRecord[]>{return new Promise((resolve,reject)=>{
  const r=indexedDB.open('pain-tracker-checks',1)
  r.onupgradeneeded=()=>{r.result.createObjectStore('days',{keyPath:'day'})}
  r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))
  r.onsuccess=()=>{const db=r.result;const tx=db.transaction('days','readonly');const value=tx.objectStore('days').getAll()
    tx.oncomplete=()=>{db.close();resolve(value.result)}
    tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}
  }
})}
export async function loadFollowUp(){const [data,slots,checks]=await Promise.all([readData(),readFoodForChecks(),readAllChecks()]);return {data,slots,checks}}
