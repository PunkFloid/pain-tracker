export const mealTimes = {
  'Snídaně': ['06:00','10:00'], 'Dopolední svačina': ['09:00','11:00'],
  'Oběd': ['11:00','14:00'], 'Odpolední svačina': ['14:00','17:30'],
  'Večeře': ['17:30','20:00'], 'Druhá večeře': ['19:30','23:00'],
}
const clean = s => s.replace(/\s+/g,' ').trim()
const norm = s => clean(s).toLocaleLowerCase('cs-CZ')
export function signature(slot) {
  return JSON.stringify(slot.items.map(item => [norm(item.name),norm(item.amount),item.kcal,
    item.ingredients.map(x=>[norm(x.name),norm(x.amount)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
  ]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))))
}
export function tags(name) {
  const n=norm(name);const result=[]
  if(/vejce|vaječ|žloutek|bílek/.test(n))result.push('vejce')
  if(/mlék|mlékár|mleko|smetan|tvaroh|sýr|syrovát|whey|skyr|jogurt|másl|mozzarella|eidam|gouda|čedar|lučina|philadelphia/.test(n))result.push('mléčná složka')
  if(/bez lakt[oó]zy|bezlakt[oó]z|lactose free/.test(n))result.push('bez laktózy – dle názvu')
  return result
}
export function parseLines(lines) {
  const slots=[];const warnings=[];let day='';let slot=null;let item=null;let pending=''
  for(const raw of lines){
    const line=clean(raw);if(!line)continue
    if(/^(Kalorické Tabulky|Jídelníček)(\s|$)/.test(line))continue
    const dm=line.match(/^(?:(?:Pondělí|Úterý|Středa|Čtvrtek|Pátek|Sobota|Neděle)\s+)?(\d{1,2})\.(\d{1,2})\.(\d{4})$/i)
    if(dm){const d=Number(dm[1]),m=Number(dm[2]),y=Number(dm[3]);const dt=new Date(Date.UTC(y,m-1,d))
      if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d){warnings.push('Neplatné datum: '+line);day=''}
      else day=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      slot=null;item=null;pending='';continue
    }
    const category=Object.keys(mealTimes).find(c=>line===c||line.startsWith(c+' '))
    if(category){
      if(pending)warnings.push('Nerozpoznaný text: '+pending)
      if(!day){warnings.push('Kategorie bez data: '+line);slot=null;continue}
      slot={key:day+'|'+category,day,category,items:[],expected:null}
      const subtotal=line.slice(category.length).trim().match(/^([\d\s,.]+)\s*kcal$/)
      if(subtotal)slot.expected=Number(subtotal[1].replace(/\s/g,'').replace(',','.'))
      slots.push(slot);item=null;pending='';continue
    }
    if(/^(Aktivity|Bílkoviny celkem|Sacharidy celkem|Tuky celkem|Vláknina celkem|Cukry celkem|Sůl celkem|Vápník celkem|Nasycené mastné kyseliny|PHE celkem|Potraviny celkem|Celkem|Pitný režim)/.test(line)){
      if(pending)warnings.push('Nerozpoznaný text: '+pending)
      slot=null;item=null;pending='';continue
    }
    if(!slot)continue
    if(/^\d[\d\s,.]*\s*kcal$/.test(line)&&!slot.items.length&&!pending){slot.expected=Number(line.replace('kcal','').replace(/\s/g,'').replace(',','.'));continue}
    const combined=clean(pending+' '+line)
    const food=combined.match(/^(.+?)\s+(\d+(?:[,.]\d+)?\s*[x×]\s*.+?)\s+([\d\s,.]+)\s*kcal$/)
    if(food){item={name:food[1],amount:food[2],kcal:Number(food[3].replace(/\s/g,'').replace(',','.')),ingredients:[]};slot.items.push(item);pending='';continue}
    const ingredient=combined.match(/^(.+?)\s+(\d+(?:[,.]\d+)?\s*[x×]\s*.+)$/)
    if(ingredient&&item&&!/kcal/.test(combined)){item.ingredients.push({name:ingredient[1],amount:ingredient[2]});pending='';continue}
    pending=combined
  }
  if(pending)warnings.push('Nerozpoznaný text: '+pending)
  const keys=new Set()
  for(const s of slots){
    if(keys.has(s.key))warnings.push('Opakovaná kategorie dne: '+s.key)
    keys.add(s.key)
    if(s.expected!==null&&Math.abs(s.expected-s.items.reduce((sum,x)=>sum+x.kcal,0))>3)warnings.push(`Nesouhlasí součet energie: ${s.day} ${s.category}`)
  }
  if(!slots.length)warnings.push('Nebyl nalezen jídelníček ve známém formátu.')
  return {slots,warnings}
}
