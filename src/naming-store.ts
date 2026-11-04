import type { NamingRule } from './naming-rules.mjs'
import { normalizeName } from './naming-rules.mjs'
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('pain-tracker-names',1);r.onupgradeneeded=()=>{r.result.createObjectStore('rules',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))})}
export async function readNamingRules():Promise<NamingRule[]>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('rules','readonly'),r=tx.objectStore('rules').getAll();tx.oncomplete=()=>{db.close();resolve(r.result)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
export async function writeNamingRule(source:string,target:string){
  source=source.trim();target=target.trim();if(!source||!target||source.length>160||target.length>160)throw new Error('Vyplň oba názvy, nejvýše 160 znaků.')
  const rule:NamingRule={id:normalizeName(source),source,target};const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('rules','readwrite');tx.objectStore('rules').put(rule);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})
}
export async function deleteNamingRule(id:string){const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('rules','readwrite');tx.objectStore('rules').delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
