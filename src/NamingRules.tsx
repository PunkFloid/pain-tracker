import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { NamingRule } from './naming-rules.mjs'
import { readNamingRules, writeNamingRule, deleteNamingRule } from './naming-store'
import './compact.css'
export default function NamingRules(){
  const [rules,setRules]=useState<NamingRule[]>([]),[source,setSource]=useState(''),[target,setTarget]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false)
  useEffect(()=>{let alive=true;readNamingRules().then(r=>{if(alive){setRules(r);setReady(true)}}).catch(e=>{if(alive)setError(String(e))});return()=>{alive=false}},[])
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy||!ready)return;setBusy(true);setError('');try{await writeNamingRule(source,target);setRules(await readNamingRules());setSource('');setTarget('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  async function remove(rule:NamingRule){if(busy||!window.confirm('Odstranit pravidlo pro '+rule.source+'?'))return;setBusy(true);setError('');try{await deleteNamingRule(rule.id);setRules(await readNamingRules())}catch(e){setError(String(e))}finally{setBusy(false)}}
  return <section className="card"><details><summary>Pravidla názvů ({rules.length})</summary><p className="table-meta">Pouze pro nově importované dny.</p><form onSubmit={submit}><label>Původní název<input className="compact-input" required maxLength={160} disabled={busy||!ready} value={source} onChange={e=>setSource(e.target.value)} placeholder="Název přesně jako v exportu"/></label><label>Skupina<input className="compact-input" required maxLength={160} disabled={busy||!ready} value={target} onChange={e=>setTarget(e.target.value)} placeholder="Společný název"/></label><button type="submit" disabled={busy||!ready}>Uložit pravidlo</button></form>
    {!!rules.length&&<table className="data-table"><thead><tr><th>Původní název</th><th>Skupina</th><th></th></tr></thead><tbody>{rules.map(r=><tr key={r.id}><td><button className="row-toggle" disabled={busy} onClick={()=>{setSource(r.source);setTarget(r.target)}}><span className="item-name">{r.source}</span></button></td><td>{r.target}</td><td><button disabled={busy} className="danger" aria-label={'Smazat pravidlo '+r.source} onClick={()=>void remove(r)}>×</button></td></tr>)}</tbody></table>}
    {error&&<p className="alert" role="alert">{error}</p>}</details></section>
}
