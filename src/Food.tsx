import { useEffect, useRef, useState } from 'react'
import { parseLines } from './food-parser.mjs'
import type { MealSlot } from './food-parser.mjs'
import { prepareNewDays, appendNewDays } from './naming-rules.mjs'
import { readNamingRules } from './naming-store'
import NamingRules from './NamingRules'
type Source={id:string;name:string;at:string}
type FoodState={slots:MealSlot[];sources:Source[]}
type TextItem={str:string;transform:number[]}
type Pdf={numPages:number;getPage:(n:number)=>Promise<{getTextContent:()=>Promise<{items:unknown[]}>;cleanup:()=>void}>}
type PdfApi={GlobalWorkerOptions:{workerSrc:string};getDocument:(o:Record<string,unknown>)=>{promise:Promise<Pdf>;destroy:()=>Promise<void>}}
function openFood():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('pain-tracker-food',1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))})}
async function readFood():Promise<FoodState>{const db=await openFood();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),r=tx.objectStore('state').get('data');tx.oncomplete=()=>{db.close();resolve(r.result??{slots:[],sources:[]})};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
async function storeFood(prepared:MealSlot[],expected:FoodState,source:Source,file:File):Promise<FoodState>{
  const db=await openFood();return new Promise((resolve,reject)=>{
    let next=expected,failure:Error|null=null;const tx=db.transaction(['state','pdfs'],'readwrite');const store=tx.objectStore('state');const r=store.get('data')
    r.onsuccess=()=>{try{const current:FoodState=r.result??{slots:[],sources:[]};if(JSON.stringify(current)!==JSON.stringify(expected))throw new Error('Data se změnila. Načti PDF znovu.');const merged=appendNewDays(current.slots,prepared);if(!merged.added.length){next=current;return}next={slots:merged.slots,sources:[...current.sources,source]};store.put(next,'data');tx.objectStore('pdfs').put(file,source.id)}catch(e){failure=e instanceof Error?e:new Error(String(e));tx.abort()}}
    tx.oncomplete=()=>{db.close();resolve(next)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(failure??tx.error)}
  })
}
async function extract(file:File,progress:(s:string)=>void){
  const base=import.meta.env.BASE_URL+'pdfjs/';const api=await import(/* @vite-ignore */ base+'pdf.min.mjs') as PdfApi;api.GlobalWorkerOptions.workerSrc=base+'pdf.worker.min.mjs'
  const task=api.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useWasm:false,useSystemFonts:true,disableFontFace:true})
  try{const pdf=await task.promise;if(pdf.numPages>150)throw new Error('Limit je 150 stran.');const lines:string[]=[]
    for(let n=1;n<=pdf.numPages;n++){progress(`Čtu stranu ${n}/${pdf.numPages}…`);const page=await pdf.getPage(n),text=await page.getTextContent();const items=text.items.filter((x):x is TextItem=>typeof x==='object'&&x!==null&&'str'in x&&'transform'in x).filter(x=>x.str.trim()).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]);const rows:{y:number;items:TextItem[]}[]=[]
      for(const x of items){const last=rows[rows.length-1];if(last&&Math.abs(last.y-x.transform[5])<2)last.items.push(x);else rows.push({y:x.transform[5],items:[x]})}
      for(const row of rows)lines.push(row.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(' '));page.cleanup()
    }return parseLines(lines)
  }finally{await task.destroy()}
}
const formatDay=(s:string)=>s.split('-').reverse().join('.')
export default function Food(){
  const [state,setState]=useState<FoodState>({slots:[],sources:[]});const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('')
  const [preview,setPreview]=useState<{fresh:MealSlot[];skipped:MealSlot[];warnings:string[];file:File}|null>(null);const lock=useRef(false)
  useEffect(()=>{let alive=true;readFood().then(s=>{if(alive){setState(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  async function inspect(file:File){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');setPreview(null)
    try{if(file.size>15*1024*1024)throw new Error('Limit je 15 MB.');if(!/\.pdf$/i.test(file.name))throw new Error('Vyber PDF.');const current=await readFood();const parsed=await extract(file,setMessage);const rules=await readNamingRules();const plan=prepareNewDays(parsed.slots,current.slots,rules);setState(current);setPreview({...plan,warnings:parsed.warnings,file});setMessage('Náhled připraven.')}catch(e){setError(String(e));setMessage('')}finally{lock.current=false;setBusy(false)}
  }
  async function confirm(){
    if(!preview||preview.warnings.length||!preview.fresh.length||lock.current)return;lock.current=true;setBusy(true);setError('')
    try{const source={id:crypto.randomUUID(),name:preview.file.name,at:new Date().toISOString()};const next=await storeFood(preview.fresh,state,source,preview.file);setState(next);setMessage(`Uloženo ${new Set(preview.fresh.map(s=>s.day)).size} nových dnů.`);setPreview(null)}catch(e){setError(String(e))}finally{lock.current=false;setBusy(false)}
  }
  const days=[...new Set(state.slots.map(s=>s.day))].sort().reverse()
  return <div className="app food"><header><h1>Jídelníček</h1></header>{error&&<p className="alert" role="alert">{error}</p>}{message&&<p className="status" role="status">{message}</p>}
    <section className="card"><h2>Import PDF</h2><input type="file" accept=".pdf,application/pdf" aria-label="Vybrat PDF jídelníčku" disabled={!ready||busy} onChange={e=>{const f=e.currentTarget.files?.[0];if(f)void inspect(f);e.currentTarget.value=''}}/></section>
    <section className="card"><h2>Importované období</h2><p>{!ready?'Načítám…':days.length?`${formatDay(days[days.length-1])} – ${formatDay(days[0])}`:'Zatím bez dat.'}</p></section>
    <NamingRules/>
    {preview&&<section className="card"><h2>Náhled</h2><p>Nové dny: {new Set(preview.fresh.map(s=>s.day)).size} · Přeskočené dny: {new Set(preview.skipped.map(s=>s.day)).size}</p>
      {!!preview.warnings.length&&<div className="alert"><p>Import nelze uložit:</p><ul>{preview.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div>}
      <div className="preview-list">{preview.fresh.map(s=><details key={s.key}><summary>{formatDay(s.day)} · {s.category} · {s.items.length} položek</summary><Meal slot={s}/></details>)}</div>
      <button className="primary" disabled={busy||!!preview.warnings.length||!preview.fresh.length} onClick={()=>void confirm()}>Uložit nové dny</button><button disabled={busy} onClick={()=>{setPreview(null);setMessage('')}}>Zrušit</button>
    </section>}
  </div>
}
function Meal({slot}:{slot:MealSlot}){return <div>{!slot.items.length&&<p>Bez položek.</p>}{slot.items.map((item,i)=><article className="food-item" key={i}><h3>{item.name}</h3><p>{item.amount} · {item.kcal} kcal{item.tracking?' → '+item.tracking.label:''}</p>{!!item.ingredients.length&&<ul>{item.ingredients.map((x,j)=><li key={j}>{x.name} — {x.amount}{x.tracking?' → '+x.tracking.label:''}</li>)}</ul>}</article>)}</div>}
