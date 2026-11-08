import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { readData, writeData } from './db'
import type { Data, Pain, Medication } from './db'
import DailyCheck from './DailyCheck'
import EpisodeFoods from './EpisodeFoods'
import './App.css'

const drugs = ['Ibalgin RapidCaps', 'Panadol Extra Rapide', 'Panadol', 'Ataralgin', 'Jiný přípravek']
const date = (value: string) => new Date(value).toLocaleString('cs-CZ', { day:'numeric', month:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
function local(value = new Date().toISOString()) {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function timestamp(value: string) {
  const d = new Date(value)
  if (!value || !Number.isFinite(d.getTime())) throw new Error('Zadej platný čas.')
  if (d.getTime() > Date.now() + 60000) throw new Error('Čas nesmí být v budoucnosti.')
  return d.toISOString()
}
type Editor = { kind:'pain'; item?:Pain } | { kind:'med'; item?:Medication }
type Ev = { kind:'pain'; at:string; item:Pain } | { kind:'med'; at:string; item:Medication }
const DAY = 864e5
const TRACK_START = '2026-10-29'
const dayKey = (v: number | string) => local(new Date(v).toISOString()).slice(0, 10)
const dec = (n: number) => n.toFixed(1).replace('.', ',')
function period(data: Data, from: number, to: number) {
  const pains = data.pains.filter(p => { const t = Date.parse(p.start); return t >= from && t < to })
  const meds = data.medications.filter(m => { const t = Date.parse(m.at); return t >= from && t < to })
  const all = new Set<string>()
  for (let t = from; t < to; t += DAY) { const k = dayKey(t); if (k >= TRACK_START) all.add(k) }
  const painDays = new Set<string>()
  for (const p of data.pains) {
    const s = Date.parse(p.start), e = p.end ? Date.parse(p.end) : Date.now()
    if (e < from || s >= to) continue
    for (let t = s; t <= e; t += DAY) painDays.add(dayKey(t))
    painDays.add(dayKey(e))
  }
  return {
    episodes: pains.length,
    avg: pains.length ? pains.reduce((a, p) => a + p.intensity, 0) / pains.length : null,
    meds: meds.reduce((a, m) => a + m.count, 0),
    free: all.size ? [...all].filter(k => !painDays.has(k)).length : null,
    names: meds,
  }
}
function medSummary(meds: Medication[]) {
  const map = new Map<string, number>()
  for (const m of meds) map.set(m.name, (map.get(m.name) ?? 0) + m.count)
  return [...map].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}×`).join(' · ')
}
function line(e: Ev) {
  return e.kind === 'pain' ? `${date(e.at)} · Bolest ${e.item.intensity}/10` : `${date(e.at)} · ${e.item.name} ${e.item.count} ks`
}
function History({ data, busy, events, edit, remove }: { data: Data; busy: boolean; events: Ev[]; edit: (e: Ev) => void; remove: (k: 'pain' | 'med', id: string) => void }) {
  const [open, setOpen] = useState('')
  if (!events.length) return <><h2>Historie</h2><section className="card">Zatím žádné záznamy.</section></>
  const now = Date.now()
  const cur = period(data, now - 30 * DAY, now + 1)
  const prev = period(data, now - 60 * DAY, now - 30 * DAY)
  const last = events[0]
  const lastMeds = last.kind === 'pain' ? data.medications.filter(m => m.painId === last.item.id) : []
  const months = new Map<string, Ev[]>()
  for (const e of events) { const k = dayKey(e.at).slice(0, 7); months.set(k, [...(months.get(k) ?? []), e]) }
  const tile = (value: string, label: string, before: string) => <section className="card"><strong>{value}</strong><p>{label}</p><small>předtím: {before}</small></section>
  const actions = (e: Ev) => <div className="row"><button disabled={busy} onClick={() => edit(e)}>Upravit</button><button className="danger" disabled={busy} onClick={() => remove(e.kind, e.item.id)}>Smazat</button></div>
  const meds30 = medSummary(cur.names)
  return <><h2>Historie</h2><p className="muted">Posledních 30 dní</p>
    <div className="stats">
      {tile(String(cur.episodes), 'epizod', String(prev.episodes))}
      {tile(cur.free === null ? '–' : String(cur.free), 'dnů bez bolesti', prev.free === null ? '–' : String(prev.free))}
      {tile(cur.avg === null ? '–' : dec(cur.avg), 'průměrná intenzita', prev.avg === null ? '–' : dec(prev.avg))}
      {tile(String(cur.meds), 'užití léků', String(prev.meds))}
    </div>
    {meds30 && <p className="muted">{meds30}</p>}
    <section className="card"><small>POSLEDNÍ ZÁZNAM</small><h3>{line(last)}</h3>
      {last.kind === 'pain' && <p>{last.item.end ? `Konec: ${date(last.item.end)}` : 'Stále probíhá'}{lastMeds.length ? ` · ${lastMeds.map(m => `${m.name} ${m.count} ks`).join(', ')}` : ''}</p>}
      {actions(last)}</section>
    <h3>Podle měsíců</h3>
    {[...months].map(([k, list]) => {
      const ps = list.filter((e): e is Extract<Ev, { kind: 'pain' }> => e.kind === 'pain')
      const ms = list.filter((e): e is Extract<Ev, { kind: 'med' }> => e.kind === 'med')
      const avg = ps.length ? dec(ps.reduce((a, e) => a + e.item.intensity, 0) / ps.length) : '–'
      const label = new Date(k + '-01T12:00:00').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
      return <details className="card" key={k}><summary>{label} · epizody {ps.length} · Ø {avg} · léky {ms.reduce((a, e) => a + e.item.count, 0)}</summary>
        {list.map(e => <div key={e.item.id}><button className="row-toggle" aria-expanded={open === e.item.id} onClick={() => setOpen(open === e.item.id ? '' : e.item.id)}>{line(e)}</button>
          {open === e.item.id && <div className="detail-content">
            {e.kind === 'pain' ? <p>{e.item.end ? `Konec: ${date(e.item.end)}` : 'Stále probíhá'}</p> : <p>{e.item.strength || 'Síla neuvedena'} · {e.item.painId ? 'Přiřazeno k bolesti' : 'Samostatný záznam'}</p>}
            {e.item.note && <p className="note">{e.item.note}</p>}{e.kind === 'pain' && <EpisodeFoods start={e.item.start} />}{actions(e)}</div>}</div>)}
      </details>
    })}
  </>
}
export default function App({visible=true}:{visible?:boolean}) {
  const [data,setData] = useState<Data>({pains:[],medications:[]})
  const [ready,setReady] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [tab,setTab] = useState('today')
  const [editor,setEditor] = useState<Editor|null>(null)
  useEffect(() => { let alive = true
    readData().then(d => { if(alive){setData(d);setReady(true)} }).catch(e => {if(alive)setError(String(e))})
    return () => {alive=false}
  },[])
  async function commit(next:Data) {
    setBusy(true);setError('');setNotice('')
    try { await writeData(next);setData(next);setNotice('Uloženo');return true }
    catch(e){setError(`Uložení selhalo: ${String(e)}`);return false}
    finally{setBusy(false)}
  }
  async function savePain(p:Pain) {
    if(p.end && p.end < p.start) throw new Error('Konec nesmí být před začátkem.')
    if(!p.end && data.pains.some(x=>x.id!==p.id && !x.end)) throw new Error('Nejdříve ukonči probíhající bolest.')
    if(data.pains.some(x=>x.id!==p.id && Date.parse(p.start)<(x.end?Date.parse(x.end):Infinity) && Date.parse(x.start)<(p.end?Date.parse(p.end):Infinity))) throw new Error('Epizoda se překrývá s jinou bolestí.')
    return commit({...data,pains:[...data.pains.filter(x=>x.id!==p.id),p]})
  }
  async function remove(kind:'pain'|'med',id:string) {
    if(!window.confirm('Smazat?'))return
    if(kind==='pain')await commit({pains:data.pains.filter(x=>x.id!==id),medications:data.medications.map(x=>x.painId===id?{...x,painId:null}:x)})
    else await commit({...data,medications:data.medications.filter(x=>x.id!==id)})
  }
  function backup(){
    const url=URL.createObjectURL(new Blob([JSON.stringify({app:'Pain Tracker',schemaVersion:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'}))
    const a=document.createElement('a');a.href=url;a.download=`pain-tracker-${new Date().toISOString().slice(0,10)}.json`;a.click()
    setTimeout(()=>URL.revokeObjectURL(url),10000)
  }
  const active=data.pains.find(x=>!x.end)
  const events:Ev[]=[...data.pains.map(item=>({kind:'pain' as const,at:item.start,item})),...data.medications.map(item=>({kind:'med' as const,at:item.at,item}))].sort((a,b)=>b.at.localeCompare(a.at))
  return <div className="app"><header><h1>Pain Tracker<span>•</span></h1></header>
    {error&&<p role="alert" className="alert">{error}</p>}<p className="status" role="status">{busy?'Ukládám…':notice}</p>
    {!ready?<section className="card">{error?'Databázi nelze otevřít. Zkus obnovit stránku.':'Načítám databázi…'}</section>:<>
    <main>{tab==='today'&&<>
      <section className={'card hero '+(active?'active':'')}><small>{active?'PROBÍHAJÍCÍ BOLEST':'RYCHLÝ ZÁZNAM'}</small><h2>{active?`Intenzita ${active.intensity}/10`:'Jak se právě cítíš?'}</h2>{active&&<p>{`Začátek: ${date(active.start)}`}</p>}
      {active?.note&&<p className="note">{active.note}</p>}<button className="primary" disabled={busy} onClick={()=>setEditor({kind:'pain',item:active})}>{active?'Upravit / ukončit bolest':'＋ Začala bolest'}</button>
      {active&&<button disabled={busy} onClick={()=>void savePain({...active,end:new Date().toISOString()}).catch(e=>setError(String(e)))}>Bolest skončila nyní</button>}</section>
      <section className="card"><h2>Záznam léku</h2><button disabled={busy} onClick={()=>setEditor({kind:'med'})}>＋ Vzal jsem lék</button></section>
      {visible&&<DailyCheck pains={data.pains}/>}
      <div className="stats"><section className="card"><strong>{data.pains.length}</strong><p>epizod bolesti</p></section><section className="card"><strong>{data.medications.length}</strong><p>užití léku</p></section></div>
    </>}
    {tab==='history'&&<History data={data} busy={busy} events={events} edit={e=>{if(e.kind==='pain')setEditor({kind:'pain',item:e.item});else setEditor({kind:'med',item:e.item})}} remove={(k,id)=>void remove(k,id)}/>}
    {tab==='settings'&&<><h2>Data a záloha</h2><section className="card"><h3>Lokální databáze</h3><button onClick={backup}>Exportovat JSON zálohu bolestí a léků</button></section><section className="card"><h3>Časová rozmezí jídel</h3><p>Snídaně 06:00–10:00<br/>Dopolední svačina 09:00–11:00<br/>Oběd 11:00–14:00<br/>Odpolední svačina 14:00–17:30<br/>Večeře 17:30–20:00<br/>Druhá večeře 19:30–23:00</p></section></>}
    </main><nav aria-label="Hlavní navigace">{[['today','Dnes'],['history','Historie'],['settings','Nastavení']].map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'selected':''} onClick={()=>setTab(id)}>{label}</button>)}</nav></>}
    {editor&&<EntryForm key={editor.item?.id??editor.kind} editor={editor} data={data} busy={busy} close={()=>setEditor(null)} savePain={savePain} saveMed={m=>commit({...data,medications:[...data.medications.filter(x=>x.id!==m.id),m]})}/>}
  </div>
}
type Props={editor:Editor;data:Data;busy:boolean;close:()=>void;savePain:(p:Pain)=>Promise<boolean>;saveMed:(m:Medication)=>Promise<boolean>}
function EntryForm({editor,data,busy,close,savePain,saveMed}:Props){
  const pain=editor.kind==='pain'?editor.item:undefined
  const med=editor.kind==='med'?editor.item:undefined
  const [time,setTime]=useState(local(pain?.start??med?.at))
  const [end,setEnd]=useState(pain?.end?local(pain.end):'')
  const [intensity,setIntensity]=useState(pain?.intensity??5)
  const [name,setName]=useState(med?(drugs.includes(med.name)?med.name:'Jiný přípravek'):drugs[0])
  const [custom,setCustom]=useState(med?.name??'')
  const [strength,setStrength]=useState(med?.strength??'')
  const [count,setCount]=useState(String(med?.count??1))
  const [painId,setPainId]=useState(med?(med.painId??''):(data.pains.find(p=>!p.end)?.id??''))
  const [note,setNote]=useState(editor.item?.note??'')
  const [error,setError]=useState('')
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return;setError('')
    try{const at=timestamp(time);let ok:boolean
      if(editor.kind==='pain')ok=await savePain({id:pain?.id??crypto.randomUUID(),start:at,end:end?timestamp(end):null,intensity,note:note.trim()})
      else{const n=Number(count);const finalName=(name==='Jiný přípravek'?custom:name).trim()
        if(!finalName)throw new Error('Vyplň název přípravku.')
        if(!Number.isFinite(n)||n<=0||!Number.isInteger(n*2))throw new Error('Počet musí být kladný násobek poloviny kusu.')
        ok=await saveMed({id:med?.id??crypto.randomUUID(),at,name:finalName,strength:strength.trim(),count:n,painId:painId||null,note:note.trim()})
      }
      if(ok)close();else setError('Uložení selhalo. Formulář zůstává otevřený.')
    }catch(e){setError(e instanceof Error?e.message:String(e))}
  }
  return <div className="overlay"><section className="sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title"><form onSubmit={submit}><h2 id="entry-title">{editor.kind==='pain'?'Záznam bolesti':'Užití léku'}</h2>
    <label>{editor.kind==='pain'?'Začátek bolesti':'Čas užití'}<input type="datetime-local" required value={time} onChange={e=>setTime(e.target.value)}/></label><button type="button" onClick={()=>setTime(local())}>Nastavit nyní</button>
    {editor.kind==='pain'?<><label>Intenzita: {intensity}/10<input type="range" min="0" max="10" value={intensity} onChange={e=>setIntensity(Number(e.target.value))}/></label><label>Konec (prázdné = probíhá)<input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></label><div className="row"><button type="button" onClick={()=>setEnd(local())}>Konec nyní</button><button type="button" onClick={()=>setEnd('')}>Stále probíhá</button></div></>:<>
    <label>Přípravek<select value={name} onChange={e=>{setName(e.target.value);setStrength('')}}>{drugs.map(n=><option key={n}>{n}</option>)}</select></label>
    {name==='Jiný přípravek'&&<label>Název<input required maxLength={120} value={custom} onChange={e=>setCustom(e.target.value)}/></label>}
    <label>Síla / varianta z obalu (volitelné)<input maxLength={120} value={strength} onChange={e=>setStrength(e.target.value)}/></label>
    <label>Počet tablet / kapslí<input type="number" inputMode="decimal" min="0.5" step="0.5" required value={count} onChange={e=>setCount(e.target.value)}/></label>
    <label>Přiřadit k bolesti<select value={painId} onChange={e=>setPainId(e.target.value)}><option value="">Samostatný záznam</option>{[...data.pains].sort((a,b)=>b.start.localeCompare(a.start)).map(p=><option key={p.id} value={p.id}>{date(p.start)}{!p.end?' · probíhá':''}</option>)}</select></label></>}
    <label>Poznámka<textarea rows={3} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label>{error&&<p role="alert" className="alert">{error}</p>}<button className="primary" type="submit" disabled={busy}>{busy?'Ukládám…':'Uložit záznam'}</button><button type="button" disabled={busy} onClick={close}>Zrušit</button>
  </form></section></div>
}
