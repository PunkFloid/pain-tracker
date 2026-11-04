import { useEffect, useState } from 'react'
import { readData } from './db'
import type { Data } from './db'
import type { MealSlot } from './food-parser.mjs'
import { tags } from './food-parser.mjs'
import { windowReport } from './time-analysis.mjs'
import type { WindowReport } from './time-analysis.mjs'
const fmt=(v:string|number)=>new Date(v).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
async function readSlots():Promise<MealSlot[]>{
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open('pain-tracker-food',1)
    r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs')}
    r.onerror=()=>reject(r.error)
    r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))
    r.onsuccess=()=>{const db=r.result;const tx=db.transaction('state','readonly');const value=tx.objectStore('state').get('data')
      tx.oncomplete=()=>{db.close();resolve(value.result?.slots??[])}
      tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}
    }
  })
}
export default function Analysis(){
  const [data,setData]=useState<Data>({pains:[],medications:[]})
  const [slots,setSlots]=useState<MealSlot[]>([])
  const [selected,setSelected]=useState('')
  const [ready,setReady]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{let alive=true
    Promise.all([readData(),readSlots()]).then(([d,s])=>{if(alive){setData(d);setSlots(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))})
    return()=>{alive=false}
  },[])
  const pains=[...data.pains].sort((a,b)=>b.start.localeCompare(a.start))
  const pain=pains.find(p=>p.id===selected)??pains[0]
  const reports=pain?[windowReport(slots,pain.start,24,0),windowReport(slots,pain.start,48,24)]:[]
  const meds=pain?data.medications.filter(m=>m.painId===pain.id||(!m.painId&&m.at>=pain.start&&m.at<=(pain.end??new Date().toISOString()))).sort((a,b)=>a.at.localeCompare(b.at)):[]
  return <main className="app food"><header><small>ČASOVÝ PŘEHLED · BEZ DIAGNÓZY</small><h1>Souvislosti</h1><p>Co předcházelo začátku vybrané bolesti.</p></header>
    {error&&<p className="alert" role="alert">{error}</p>}
    {!ready?<section className="card">{error?'Data nelze načíst. Zkus stránku obnovit.':'Načítám data…'}</section>:!pain?<section className="card"><p>Nejprve zaznamenej alespoň jednu bolest v části Bolesti a léky.</p></section>:<>
    <section className="card"><label>Vybrat epizodu<select value={pain.id} onChange={e=>setSelected(e.target.value)}>{pains.map(p=><option key={p.id} value={p.id}>{fmt(p.start)} · {p.intensity}/10</option>)}</select></label><p>Začátek: {fmt(pain.start)}<br/>Konec: {pain.end?fmt(pain.end):'stále probíhá'}</p>{pain.note&&<p className="note">{pain.note}</p>}<p className="muted">Okna počítáme pouze před začátkem epizody, ne před každým dnem pokračující bolesti.</p></section>
    <section className="card"><h2>Jak číst výsledek</h2><p>Celé rozmezí: interval jídla leží uvnitř okna. Možný překryv: neznáme přesný čas a zařazení je nejisté.</p><p className="muted">Stejné jídlo může kvůli nejistému času zasahovat do obou oken. Není to dvojí konzumace a počty mezi okny nesčítáme. Rozmezí vykládáme v aktuálním časovém pásmu zařízení: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Při cestování do jiného pásma může být výsledek nepřesný.</p><p className="muted">Toto není porovnání s obdobími bez bolesti ani určení spouštěče. Neznámé složení a chybějící záznamy nejsou důkaz nepřítomnosti potraviny.</p></section>
    {reports.map((report,i)=><Report key={i} report={report} title={i===0?'0–24 hodin před začátkem':'24–48 hodin před začátkem'}/>)}
    <section className="card"><h2>Léky při této epizodě</h2>{meds.length?meds.map(m=><p key={m.id}>{fmt(m.at)} · {m.name} · {m.count} ks{m.strength?' · '+m.strength:''}<br/><span className="muted">{m.painId===pain.id?'Ručně přiřazeno k epizodě':'Samostatný záznam v časovém průběhu epizody'}</span></p>):<p>Žádné přiřazené nebo časově odpovídající záznamy.</p>}</section>
    </>}
  </main>
}
function Report({report,title}:{report:WindowReport;title:string}){return <section className="card"><h2>{title}</h2><p>{fmt(report.low)} → {fmt(report.high)}</p><p>Import dat: {report.imported} z {report.expected} časově relevantních kategorií.</p><p className="muted">Tento počet ověřuje jen existenci importu kategorie, nikoli úplnost jídelníčku. Kategorie bez položek také neznamená potvrzené vynechání jídla.</p>
  {!!report.missing.length&&<details><summary>Chybějící kategorie: {report.missing.length}</summary><ul>{report.missing.map(k=><li key={k}>{k.split('|')[0].split('-').reverse().join('.')} · {k.split('|')[1]}</li>)}</ul></details>}
  {!report.rows.length&&<p>V tomto okně nejsou rozpoznaná jídla. Nelze z toho vyvodit, že jsi nejedl nebo neměl danou surovinu.</p>}
  {report.rows.map(row=><details key={row.slot.key}><summary>{row.slot.day.split('-').reverse().join('.')} · {row.slot.category}<br/>{row.status==='inside'?'Celé rozmezí v okně':'Možný překryv – nejisté zařazení'}</summary><p className="muted">Interval konzumace: {fmt(row.start)} – {fmt(row.end)}</p>{row.slot.items.map((item,i)=><article className="food-item" key={i}><h3>{item.name}</h3><p>{item.amount}</p>{!!tags(item.name).length&&<p className="muted">Výslovný název: {tags(item.name).join(' · ')}</p>}{item.ingredients.length?<ul>{item.ingredients.map((x,j)=><li key={j}>{x.name} — {x.amount}{tags(x.name).length?' · '+tags(x.name).join(' · '):''}</li>)}</ul>:<p className="muted">Receptura není rozepsaná.</p>}</article>)}</details>)}
</section>}
