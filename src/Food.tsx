import { useEffect, useRef, useState } from 'react'
import { mealTimes, parseLines, signature, tags } from './food-parser.mjs'
import type { MealSlot } from './food-parser.mjs'

type Source = {id:string;name:string;at:string}
type FoodState = {slots:MealSlot[];sources:Source[]}
type TextItem = {str:string;transform:number[]}
type Pdf = {numPages:number;getPage:(n:number)=>Promise<{getTextContent:()=>Promise<{items:unknown[]}>;cleanup:()=>void}>}
type PdfApi = {GlobalWorkerOptions:{workerSrc:string};getDocument:(o:Record<string,unknown>)=>{promise:Promise<Pdf>;destroy:()=>Promise<void>}}
function openFood():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  const r=indexedDB.open('pain-tracker-food',1)
  r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs')}
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)
  r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))
})}
async function readFood():Promise<FoodState>{const db=await openFood();return new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readonly');const r=tx.objectStore('state').get('data')
  tx.oncomplete=()=>{db.close();resolve(r.result??{slots:[],sources:[]})}
  tx.onabort=()=>{db.close();reject(tx.error)};tx.onerror=()=>{db.close();reject(tx.error)}
})}
async function storeFood(state:FoodState,source:Source,file:File){const db=await openFood();return new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(['state','pdfs'],'readwrite');tx.objectStore('state').put(state,'data');tx.objectStore('pdfs').put(file,source.id)
  tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>{db.close();reject(tx.error)};tx.onerror=()=>{db.close();reject(tx.error)}
})}
async function original(id:string):Promise<Blob>{const db=await openFood();return new Promise((resolve,reject)=>{
  const tx=db.transaction('pdfs','readonly');const r=tx.objectStore('pdfs').get(id)
  tx.oncomplete=()=>{db.close();if(r.result)resolve(r.result);else reject(new Error('Původní PDF nenalezeno.'))}
  tx.onabort=()=>{db.close();reject(tx.error)};tx.onerror=()=>{db.close();reject(tx.error)}
})}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
async function extract(file:File,progress:(s:string)=>void){
  const base=import.meta.env.BASE_URL+'pdfjs/'
  const api=await import(/* @vite-ignore */ base+'pdf.min.mjs') as PdfApi
  api.GlobalWorkerOptions.workerSrc=base+'pdf.worker.min.mjs'
  const task=api.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useWasm:false,useSystemFonts:true,disableFontFace:true})
  try{const pdf=await task.promise;if(pdf.numPages>150)throw new Error('Limit je 150 stran na jeden import.')
    const lines:string[]=[]
    for(let n=1;n<=pdf.numPages;n++){
      progress(`Čtu stranu ${n} z ${pdf.numPages}…`)
      const page=await pdf.getPage(n);const text=await page.getTextContent()
      const items=text.items.filter((x):x is TextItem=>typeof x==='object'&&x!==null&&'str'in x&&'transform'in x) .filter(x=>x.str.trim()).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4])
      const rows:{y:number;items:TextItem[]}[]=[]
      for(const x of items){const last=rows[rows.length-1];if(last&&Math.abs(last.y-x.transform[5])<2)last.items.push(x);else rows.push({y:x.transform[5],items:[x]})}
      for(const row of rows)lines.push(row.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(' '))
      page.cleanup()
    }
    return parseLines(lines)
  }finally{await task.destroy()}
}
function diff(slot:MealSlot,state:FoodState){const old=state.slots.find(x=>x.key===slot.key);return !old?'new':signature(old)===signature(slot)?'same':'conflict'}
const formatDay=(s:string)=>s.split('-').reverse().join('.')
export default function Food(){
  const [state,setState]=useState<FoodState>({slots:[],sources:[]})
  const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false)
  const [error,setError]=useState('');const [message,setMessage]=useState('')
  const [preview,setPreview]=useState<{slots:MealSlot[];warnings:string[];file:File}|null>(null)
  const [replace,setReplace]=useState<string[]>([]);const [day,setDay]=useState('')
  const [confirmed,setConfirmed]=useState(false)
  const lock=useRef(false)
  useEffect(()=>{let alive=true;readFood().then(s=>{if(alive){setState(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  async function inspect(file:File){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');setPreview(null);setReplace([]);setConfirmed(false)
    try{if(file.size>15*1024*1024)throw new Error('Limit souboru je 15 MB. Rozděl export na kratší období.')
      if(!/\.pdf$/i.test(file.name))throw new Error('Vyber soubor PDF.')
      const parsed=await extract(file,setMessage);setPreview({...parsed,file});setMessage('Náhled připraven. Zkontroluj jej před uložením.')
    }catch(e){setError(`Import nelze přečíst: ${String(e)}`);setMessage('')}
    finally{lock.current=false;setBusy(false)}
  }
  async function confirm(){
    if(!preview||preview.warnings.length||!confirmed||lock.current)return
    const chosen=preview.slots.filter(s=>diff(s,state)==='new'||(diff(s,state)==='conflict'&&replace.includes(s.key)))
    if(!chosen.length){setMessage('Žádné nové změny. Existující záznamy zůstaly beze změny.');return}
    lock.current=true;setBusy(true);setError('')
    try{const current=await readFood();if(JSON.stringify(current)!==JSON.stringify(state)){setState(current);setReplace([]);setConfirmed(false);throw new Error('Data se změnila v jiné kartě. Zkontroluj znovu náhled.')}
      const source={id:crypto.randomUUID(),name:preview.file.name,at:new Date().toISOString()}
      const keys=new Set(chosen.map(x=>x.key));const next={slots:[...state.slots.filter(x=>!keys.has(x.key)),...chosen],sources:[...state.sources,source]}
      await storeFood(next,source,preview.file);setState(next);setDay(chosen[0].day);setPreview(null)
      setMessage(`Uloženo ${chosen.length} kategorií jídel. Původní PDF je uložené pouze v tomto zařízení.`)
    }catch(e){setError(String(e))}finally{lock.current=false;setBusy(false)}
  }
  const days=[...new Set(state.slots.map(s=>s.day))].sort().reverse()
  const selected=day||days[0]||''
  const count=(kind:string)=>preview?.slots.filter(s=>diff(s,state)===kind).length??0
  return <div className="app food"><header><small>JÍDELNÍČEK · IMPORT PDF</small><h1>Jídlo a suroviny</h1><p>Nejprve kontrola, potom uložení. Bez odesílání PDF na server.</p></header>
    {error&&<p className="alert" role="alert">{error}</p>}{message&&<p className="status" role="status">{message}</p>}
    <section className="card"><h2>Import z Kalorických tabulek</h2><p>Vyber export ve stejném formátu jako dodaná ukázka. Skeny a fotografie zatím neumíme. Prázdná kategorie automaticky neznamená, že jsi nejedl.</p><label className="file-label">Vybrat PDF<input type="file" accept=".pdf,application/pdf" disabled={!ready||busy} onChange={e=>{const f=e.currentTarget.files?.[0];if(f)void inspect(f);e.currentTarget.value=''}}/></label><p className="muted">Soubor zůstane lokálně uložený spolu s rozpoznanými záznamy. Limit 15 MB / 150 stran. Název PDF může obsahovat osobní údaje.</p></section>
    {preview&&<section className="card"><h2>Náhled importu</h2><p>{preview.slots.length} kategorií · {preview.slots.reduce((a,s)=>a+s.items.length,0)} jídel<br/>Nové: {count('new')} · Shodné: {count('same')} · Změněné: {count('conflict')}</p>
      {!!preview.warnings.length&&<div className="alert"><p>Import je zablokovaný kvůli nejasnostem. Nic se neuložilo.</p><ul>{preview.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div>}
      <p className="muted">Shodné kategorie přeskočíme. U změněné kategorie zachováme původní data, pokud výslovně nepovolíš nahrazení celého seznamu jídel. To může odstranit dříve uložené položky této kategorie.</p>
      <div className="preview-list">{preview.slots.map((s,i)=><details key={s.key+'-'+i}><summary>{formatDay(s.day)} · {s.category} · {s.items.length} jídel · {{new:'nové',same:'shodné – přeskočit',conflict:'změna – rozhodni'}[diff(s,state)]}</summary>
        {diff(s,state)==='conflict'&&<><h4>Dosud uložené</h4><Meal slot={state.slots.find(x=>x.key===s.key)!}/><h4>Nový export</h4></>}<Meal slot={s}/>
        {diff(s,state)==='conflict'&&<label className="check"><input type="checkbox" disabled={busy} checked={replace.includes(s.key)} onChange={e=>{setReplace(e.target.checked?[...replace,s.key]:replace.filter(k=>k!==s.key));setConfirmed(false)}}/>Nahradit celou tuto kategorii novým exportem</label>}
      </details>)}</div>
      <label className="check"><input type="checkbox" checked={confirmed} disabled={busy||!!preview.warnings.length} onChange={e=>setConfirmed(e.target.checked)}/>Zkontroloval jsem náhled a souhlasím s uložením vybraných změn.</label>
      <button className="primary" disabled={busy||!confirmed||!!preview.warnings.length||count('new')+replace.length===0} onClick={()=>void confirm()}>Uložit vybrané změny</button><button disabled={busy} onClick={()=>{setPreview(null);setMessage('Import zrušen.')}}>Zrušit náhled</button>
    </section>}
    <section className="card"><h2>Uložený jídelníček</h2>{!days.length?<p>Zatím žádné importované dny.</p>:<><label>Den<select value={selected} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d} value={d}>{formatDay(d)}</option>)}</select></label>{state.slots.filter(s=>s.day===selected).sort((a,b)=>Object.keys(mealTimes).indexOf(a.category)-Object.keys(mealTimes).indexOf(b.category)).map(s=><details key={s.key} open><summary>{s.category} · {mealTimes[s.category]?.join('–')}</summary><Meal slot={s}/></details>)}</>}</section>
    {!!state.sources.length&&<section className="card"><h2>Původní soubory a záloha</h2>{state.sources.map(s=><button key={s.id} disabled={busy} onClick={()=>void original(s.id).then(b=>download(b,s.name)).catch(e=>setError(String(e)))}>Stáhnout PDF: {s.name}</button>)}<button onClick={()=>download(new Blob([JSON.stringify({app:'Pain Tracker Food',schemaVersion:1,state},null,2)],{type:'application/json'}),'pain-tracker-food-backup.json')}>Exportovat jídelní data do JSON</button><p className="muted">Tento export obsahuje pouze jídla, ne bolesti, léky ani původní PDF. Obnovení zálohy zatím není implementované. Originály stáhni zvlášť.</p></section>}
  </div>
}
function Meal({slot}:{slot:MealSlot}){return <div>{!slot.items.length&&<p className="muted">V exportu nejsou položky. Úplnost dne nebyla potvrzena.</p>}{slot.items.map((item,i)=><article className="food-item" key={i}><h3>{item.name}</h3><p>{item.amount} · {item.kcal} kcal</p>{!!tags(item.name).length&&<p className="muted">Výslovný název: {tags(item.name).join(' · ')}</p>}{item.ingredients.length?<><small>SUROVINY UVEDENÉ V PDF</small><ul>{item.ingredients.map((x,j)=><li key={j}>{x.name} — {x.amount}{tags(x.name).length?' · '+tags(x.name).join(' · '):''}</li>)}</ul></>:<p className="muted">Bez rozepsané receptury. Název není důkaz úplného složení; neznámá surovina není totéž co nepřítomná.</p>}</article>)}</div>}
