const KEY='pain-tracker-food-reviews'
const STATUSES=['watch','ok','suspect']
export function parseFoodReviews(text){
  if(text===null)return {version:1,items:{}}
  const data=JSON.parse(text)
  if(!data||data.version!==1||!data.items||typeof data.items!=='object'||Array.isArray(data.items))throw new Error('Neplatná data skupin jídel.')
  for(const entry of Object.values(data.items))if(!entry||typeof entry!=='object'||(entry.status!==undefined&&!STATUSES.includes(entry.status))||typeof entry.note!=='string'||typeof entry.updatedAt!=='string')throw new Error('Neplatný záznam skupiny jídla.')
  return data
}
export function parseDeferred(text){const data=text===null?[]:JSON.parse(text);if(!Array.isArray(data)||!data.every(x=>typeof x==='string'))throw new Error('Neplatný seznam odložených jídel.');return data}
export function readFoodReviews(storage=localStorage){return parseFoodReviews(storage.getItem(KEY))}
export function writeFoodReview(id,patch,storage=localStorage){
  const data=readFoodReviews(storage),old=data.items[id]??{note:''}
  const entry={...old,...patch,updatedAt:new Date().toISOString()}
  if(entry.status!==undefined&&!STATUSES.includes(entry.status))throw new Error('Neplatná skupina.')
  if(typeof entry.note!=='string'||entry.note.length>2000)throw new Error('Poznámka může mít nejvýše 2000 znaků.')
  const next={version:1,items:{...data.items,[id]:entry}}
  storage.setItem(KEY,JSON.stringify(next));return next
}
export function episodeIds(row){return [...new Set(row.groups.filter(g=>g.status==='pain').flatMap(g=>g.painIds))]}
