import { useEffect, useState } from 'react'
import { parseFoodReviews, writeFoodReview } from './food-review.mjs'
import type { FoodStatus } from './food-review.mjs'
import { previewIngredientReviewMigration } from './ingredient-review-migration.mjs'
import type { IngredientReviewMigration } from './ingredient-review-migration.mjs'
const labels: Record<FoodStatus,string> = { watch: 'Sleduji', ok: 'Běžně OK', suspect: 'Podezřelé' }
function label(id: string) {
  try { const key = JSON.parse(id.slice(id.indexOf('|') + 1)); return String(key.at(-1)) } catch { return id }
}
export default function ReviewMigration({revision,onChanged}:{revision:number;onChanged:()=>void}) {
  const [migration,setMigration] = useState<IngredientReviewMigration|null>(null)
  const [error,setError] = useState('')
  useEffect(() => {
    const refresh = () => { try { setMigration(previewIngredientReviewMigration(parseFoodReviews(localStorage.getItem('pain-tracker-food-reviews')))); setError('') } catch(e) { setError(String(e)) } }
    refresh(); window.addEventListener('food-reviews-changed',refresh)
    return () => window.removeEventListener('food-reviews-changed',refresh)
  },[revision])
  function resolve(target:string,status:FoodStatus) {
    try { writeFoodReview(target,{status,note:''}); onChanged() } catch(e) { setError(String(e)) }
  }
  if(error)return <section className="app"><p role="alert">Převod hodnocení: {error}</p></section>
  if(!migration)return null
  const history = Object.entries(migration.original.items).filter(([id]) => migration.aliases[id] && migration.aliases[id] !== id)
  if(!history.length && !migration.conflicts.length)return null
  return <section className="app food compact-view" style={{paddingBottom:0}}><div className="card">{migration.conflicts.length>0&&<><h2>Hodnocení k vyřešení ({migration.conflicts.length})</h2><p>Do vyřešení je společná surovina vedená bez převzatého hodnocení. Původní rozhodnutí a poznámky zůstávají zachované níže.</p>{migration.conflicts.map(c=><article key={c.target}><h3>{label(c.target)}</h3><p>{c.reason==='status'?'Původní položky mají různá hodnocení.':'Spojené poznámky překračují limit editoru.'}</p><ul>{c.entries.map(e=><li key={e.id}>{label(e.id)} · {e.review.status?labels[e.review.status]:'Bez hodnocení'}{e.review.note&&<p style={{whiteSpace:'pre-wrap'}}>{e.review.note}</p>}</li>)}</ul><div className="row">{(['watch','ok','suspect'] as FoodStatus[]).map(s=><button key={s} onClick={()=>resolve(c.target,s)}>{labels[s]}</button>)}</div></article>)}</>}<details><summary>Původní hodnocení surovin ({history.length})</summary><p>Archiv zůstává dostupný i po vyřešení konfliktů. Poznámku společné suroviny lze upravit v jejím detailu.</p><ul>{history.map(([id,r])=><li key={id}>{label(id)} · {r.status?labels[r.status]:'Bez hodnocení'}{r.note&&<p style={{whiteSpace:'pre-wrap'}}>{r.note}</p>}</li>)}</ul></details></div></section>
}
