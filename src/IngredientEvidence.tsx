import { useEffect, useState } from 'react'
import { loadFollowUp } from './follow-up-store'
import { readIngredientRules } from './ingredient-rules.mjs'
import { resolveIngredients } from './ingredient-resolution.mjs'
import { readIncludeInferred, writeIncludeInferred } from './ingredient-evidence.mjs'
export default function IngredientEvidence({revision,onChanged}:{revision:number;onChanged:()=>void}) {
  const [include,setInclude]=useState(true),[ready,setReady]=useState(false),[error,setError]=useState(''),[warnings,setWarnings]=useState<{name:string;messages:string[]}[]>([])
  useEffect(()=>{let alive=true;
    loadFollowUp().then(data=>{
      if(!alive)return
      setInclude(readIncludeInferred());setReady(true)
      const rules=readIngredientRules(),found=new Map<string,Set<string>>()
      for(const slot of data.slots)for(const item of slot.items){
        const result=resolveIngredients(item,rules)
        if(result.warnings.length){const messages=found.get(item.name)??new Set<string>();for(const warning of result.warnings)messages.add(warning);found.set(item.name,messages)}
      }
      setWarnings([...found].map(([name,messages])=>({name,messages:[...messages]})));setError('')
    }).catch(e=>{if(alive)setError(String(e))})
    return()=>{alive=false}
  },[revision])
  function change(value:boolean){try{writeIncludeInferred(value);setInclude(value);setError('');onChanged()}catch(e){setError(String(e))}}
  function explain(message:string){if(message.startsWith('cycle:'))return 'Kruhový odkaz mezi recepty: '+message.slice(6);if(message.startsWith('depth-limit:'))return 'Dosažen limit hloubky: '+message.slice(12);if(message==='node-limit')return 'Rozklad překročil limit velikosti.';return message}
  return <section className="app food compact-view" style={{paddingBottom:0}}><div className="card"><label><input type="checkbox" checked={include} disabled={!ready} onChange={e=>change(e.target.checked)}/> Zahrnout odvozené suroviny</label><p className="muted">{include?'Tabulka a návrhy zahrnují také automatický obecný rozklad.':'Tabulka a návrhy používají jen ručně zadané suroviny a údaje ze zdroje. Automaticky odvozené výskyty jsou vynechané.'} Nejde o potvrzení úplnosti receptury ani příčiny bolesti. Dohledání původních jídel nadále ukazuje všechny zdroje. Historická hodnocení se přepnutím nemění.</p>{error&&<p role="alert">{error}</p>}{warnings.length>0&&<details><summary>Upozornění k rozkladu ({warnings.length} jídel)</summary><p>Rozklad těchto jídel byl částečně přerušený. Statistiky mohou zahrnovat jen zbývající rozpoznané přísady.</p><ul>{warnings.map(w=><li key={w.name}>{w.name}<ul>{w.messages.map(m=><li key={m}>{explain(m)}</li>)}</ul></li>)}</ul><a href="#food-composition">Opravit ve Složení jídel</a></details>}</div></section>
}
