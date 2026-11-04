import { useEffect, useState } from 'react'
import { readData } from './db'
import type { Data } from './db'
import type { MealSlot } from './food-parser.mjs'
import { foodStatistics } from './food-statistics.mjs'
const fmt=(v:string)=>new Date(v).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
async function readSlots():Promise<MealSlot[]>{return new Promise((resolve,reject)=>{
  const r=indexedDB.open('pain-tracker-food',1)
  r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs')}
  r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Zavři ostatní karty aplikace.'))
  r.onsuccess=()=>{const db=r.result;const tx=db.transaction('state','readonly');const value=tx.objectStore('state').get('data')
    tx.oncomplete=()=>{db.close();resolve(value.result?.slots??[])}
    tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}
  }
})}
export default function Statistics(){
  const [data,setData]=useState<Data>({pains:[],medications:[]})
  const [slots,setSlots]=useState<MealSlot[]>([])
  const [ready,setReady]=useState(false);const [error,setError]=useState('')
  const [kind,setKind]=useState<'food'|'ingredient'>('food')
  const [window,setWindow]=useState('48');const [partial,setPartial]=useState(false);const [search,setSearch]=useState('')
  useEffect(()=>{let alive=true
    Promise.all([readData(),readSlots()]).then(([d,s])=>{if(alive){setData(d);setSlots(s);setReady(true)}}).catch(e=>{if(alive)setError(String(e))})
    return()=>{alive=false}
  },[])
  const result=foodStatistics(slots,data.pains,kind,window==='24'?24:48,window==='older'?24:0,partial)
  const query=search.normalize('NFC').trim().toLocaleLowerCase('cs-CZ')
  const rows=result.rows.filter(r=>r.key.includes(query))
  return <main className="app food"><header><small>POPISNÉ STATISTIKY · BEZ URČENÍ PŘÍČINY</small><h1>Statistiky</h1><p>Co se nejčastěji opakuje před začátky bolestí.</p></header>
    {error&&<p className="alert" role="alert">{error}</p>}
    {!ready?<section className="card">{error?'Data se nepodařilo načíst. Zkus obnovit stránku.':'Načítám data…'}</section>:<>
    <section className="card"><label>Zobrazit<select value={kind} onChange={e=>setKind(e.target.value as 'food'|'ingredient')}><option value="food">Jídla a potraviny</option><option value="ingredient">Suroviny rozepsané v receptech</option></select></label>
      <label style={{marginTop:16}}>Časové okno<select value={window} onChange={e=>setWindow(e.target.value)}><option value="48">0–48 hodin před začátkem</option><option value="24">0–24 hodin před začátkem</option><option value="older">24–48 hodin před začátkem</option></select></label>
      <label className="check"><input type="checkbox" checked={partial} onChange={e=>setPartial(e.target.checked)}/>Zahrnout i okna, ve kterých některé dny nemají žádný import</label>
      <label>Hledat název<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Např. banán nebo vejce" style={{width:'100%',fontSize:16,padding:12,marginTop:8,borderRadius:10,border:'1px solid #40536a',background:'#0e1928',color:'#e9eef5'}}/></label>
    </section>
    <section className="card"><h2>Podklad výpočtu</h2><p>Vyhodnoceno {result.eligible} z {result.totalPains} epizod.<br/>Bez importu v celém okně: {result.noData}.<br/>Vynecháno kvůli dnům bez importu: {result.incomplete}.<br/>Zahrnutá okna s některými dny bez importu: {result.partial}.</p><p className="muted">Chybějící svačiny nebo jiné vynechané chody epizodu nevyřazují. Kontrolujeme jen přítomnost nějakého importu pro každý kalendářní den v okně, nikoli úplnost jídelníčku. Úplnost potvrzuješ ty v Kontrole minulého dne; tato potvrzení se do statistik zatím nezapojují.</p></section>
    <section className="card"><h2>Jak číst žebříček</h2><p>Pořadí určuje počet různých epizod, před kterými se položka objevila, včetně možných časových překryvů. Opakované porce před stejnou epizodou se počítají jen jednou.</p><p className="muted">Celé rozmezí = alespoň jeden interval konzumace leží celý v okně. Pouze možný překryv = žádný takový interval nemáme, ale konzumace do okna zasahovat může. Pro každou položku a epizodu používáme jen jednu z těchto kategorií.</p><p className="muted">Běžná četnost znamená počet dnů s položkou v celém importu, ne kontrolní období bez bolesti. Žebříček není riziko po konzumaci, neprokazuje spouštěč a neoznačuje bezpečné potraviny. Často jedené potraviny mohou být vysoko jen kvůli běžné četnosti.</p><p className="muted">{kind==='ingredient'?'Zde jsou jen suroviny skutečně rozepsané v receptech PDF. Samostatný banán najdeš v pohledu Jídla a potraviny.':'Zde jsou názvy hlavních položek exportu, včetně jednotlivých potravin a celých jídel.'} Sjednocujeme pouze velikost písmen a mezery, nikoli značky, různé receptury či synonyma. Časové pásmo vychází z aktuálního nastavení zařízení.</p></section>
    {!result.eligible&&<section className="card"><p>Zatím není žádná epizoda s dostupnými importovanými dny pro toto nastavení. Doplň chybějící dny, nebo výslovně povol okna s některými dny bez importu. Nejde o požadavek na počet jídel.</p></section>}
    {!!result.eligible&&!rows.length&&<section className="card"><p>Pro zvolené filtry nejsou žádné opakující se položky. Neznamená to nepřítomnost potravin ani jejich bezpečnost.</p></section>}
    {rows.map((r,i)=><section className="card" key={r.key}><small>POŘADÍ V ZOBRAZENÉM SEZNAMU: {i+1}</small><h2>{r.name}</h2><p>Před {r.total} z {result.eligible} vyhodnocených epizod (včetně možných překryvů).</p><p>Celé rozmezí v okně: {r.inside} epizod.<br/>Pouze možný překryv: {r.possible} epizod.<br/>Běžná četnost v celém importu: {r.days} z {result.importedDays} importovaných dnů.</p><details><summary>Zobrazit příslušné epizody</summary><ul>{r.hits.map(h=><li key={h.painId}>{fmt(h.start)} · {h.status==='inside'?'celé rozmezí':'možný překryv'}</li>)}</ul></details></section>)}
    </>}
  </main>
}
