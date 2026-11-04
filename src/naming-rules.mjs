export const normalizeName=s=>s.normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('cs-CZ')
export function trackedIdentity(item){
  const t=item.tracking
  if(t?.version===1&&typeof t.id==='string'&&t.id.trim()&&typeof t.label==='string'&&t.label.trim())return {key:JSON.stringify(['group',1,t.id]),name:t.label+' · skupina'}
  const raw=normalizeName(item.name)
  return {key:raw?JSON.stringify(['raw',raw]):'',name:item.name}
}
function mapItem(item,rules){
  const mapped={...item};delete mapped.tracking
  const rule=rules.get(normalizeName(item.name))
  if(rule)mapped.tracking={version:1,id:normalizeName(rule.target),label:rule.target.trim()}
  return mapped
}
export function prepareNewDays(incoming,stored,rules){
  const oldDays=new Set(stored.map(s=>s.day))
  const lookup=new Map(rules.filter(r=>r.source.trim()&&r.target.trim()).map(r=>[normalizeName(r.source),r]))
  const fresh=[],skipped=[]
  for(const slot of incoming){
    if(oldDays.has(slot.day)){skipped.push(slot);continue}
    fresh.push({...slot,namingVersion:1,items:slot.items.map(item=>({...mapItem(item,lookup),ingredients:item.ingredients.map(x=>mapItem(x,lookup))}))})
  }
  return {fresh,skipped}
}
export function appendNewDays(stored,incoming){
  const oldDays=new Set(stored.map(s=>s.day)),seen=new Set()
  const added=incoming.filter(s=>!oldDays.has(s.day))
  for(const slot of added){if(seen.has(slot.key))throw new Error('Duplicitní kategorie v novém dni.');seen.add(slot.key)}
  return {slots:[...stored,...added],added}
}
