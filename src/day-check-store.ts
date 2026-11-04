import { readData } from './db'
import type { MealSlot } from './food-parser.mjs'
import { foodSnapshot, validateCheck } from './day-check-logic.mjs'
import type { DayCheckRecord, HeadacheChoice, FoodChoice } from './day-check-logic.mjs'
function openChecks():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  const r=indexedDB.open('pain-tracker-checks',1)
  r.onupgradeneeded=()=>{r.result.createObjectStore('days',{keyPath:'day'})}
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)
  r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))
})}
export async function readCheck(day:string):Promise<DayCheckRecord|null>{
  const db=await openChecks();return new Promise((resolve,reject)=>{
    const tx=db.transaction('days','readonly');const r=tx.objectStore('days').get(day)
    tx.oncomplete=()=>{db.close();resolve(r.result??null)}
    tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}
  })
}
export function readFoodForChecks():Promise<MealSlot[]>{return new Promise((resolve,reject)=>{
  const r=indexedDB.open('pain-tracker-food',1)
  r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs')}
  r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))
  r.onsuccess=()=>{const db=r.result;const tx=db.transaction('state','readonly');const value=tx.objectStore('state').get('data')
    tx.oncomplete=()=>{db.close();resolve(value.result?.slots??[])}
    tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}
  }
})}
export async function saveCheck(day:string,headache:HeadacheChoice,food:FoodChoice,expectedRevision:string|null):Promise<{record:DayCheckRecord;slots:MealSlot[]}>{
  const [data,slots]=await Promise.all([readData(),readFoodForChecks()])
  const errors=validateCheck({day,headache,food},data.pains,slots)
  if(errors.length)throw new Error(errors.join(' '))
  const record:DayCheckRecord={version:1,day,headache,food,foodSignature:foodSnapshot(day,slots).signature,zone:Intl.DateTimeFormat().resolvedOptions().timeZone,updatedAt:new Date().toISOString(),revision:crypto.randomUUID()}
  const db=await openChecks()
  await new Promise<void>((resolve,reject)=>{
    let conflict=false;const tx=db.transaction('days','readwrite');const store=tx.objectStore('days');const r=store.get(day)
    r.onsuccess=()=>{if((r.result?.revision??null)!==expectedRevision){conflict=true;tx.abort();return}store.put(record)}
    tx.oncomplete=()=>{db.close();resolve()}
    tx.onerror=()=>{db.close();reject(tx.error)}
    tx.onabort=()=>{db.close();reject(conflict?new Error('Kontrola byla změněna v jiné kartě. Obnov stránku a zkontroluj ji znovu.'):tx.error)}
  })
  return {record,slots}
}
