const KEY='pain-tracker-ingredient-rules'
export const INGREDIENT_RULES_VERSION=1
export const ingredientKey=s=>s.normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('cs-CZ')
const plain=s=>ingredientKey(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const lactoseFree=n=>/bezlakto|bez lakto|lactose[ -]?free|lactofree/.test(n)
const glutenFree=n=>/bezlepk|bez lepku|gluten[ -]?free|(?:ryzov|kukuricn)\w* (?:mouk|nudl|testovin|tortill)/.test(n)
const dairy=(name,n)=>name+(lactoseFree(n)?' bez laktózy':'')
export function generalIngredient(name){
  const n=plain(name)
  if(/mouk|\bflour\b/.test(n))return glutenFree(n)?'Bezlepková mouka':'Mouka'
  if(/smetan|\bcream\b/.test(n))return dairy('Smetana',n)
  if(/\bmlek|\bmilk\b/.test(n))return dairy('Mléko',n)
  if(/tvaroh/.test(n))return dairy('Tvaroh',n)
  if(/jogurt|yogurt|\bskyr\b/.test(n))return dairy('Jogurt',n)
  if(/\bsyr\b|\bsyru\b|\bsyrem\b|eidam|gouda|mozzarell|cedar|cheddar|parmez|parmeg/.test(n))return dairy('Sýr',n)
  if(/\bmasl|\bbutter\b/.test(n))return dairy('Máslo',n)
  if(/vejce|vajec|zlout|bilek|volske oko/.test(n))return 'Vejce'
  const simple=[[/\bbanan/,'Banán'],[/\bjablk|\bjablecn/,'Jablko'],[/\bbrambor/,'Brambory'],[/\bmrkev|\bmrkv/,'Mrkev'],[/\bcuket/,'Cuketa'],[/\blilek/,'Lilek'],[/\bpaprik/,'Paprika'],[/\bspenat/,'Špenát'],[/\bcibul/,'Cibule'],[/\bcesnek/,'Česnek'],[/\brajcat/,'Rajče'],[/\btvaroh/,'Tvaroh'],[/\bkurec/,'Kuřecí maso'],[/\bveprov/,'Vepřové maso'],[/\bhovez/,'Hovězí maso'],[/\bryze\b|\bryzi\b/,'Rýže'],[/\bcukr/,'Cukr'],[/\bolej/,'Olej'],[/\bkakao/,'Kakao'],[/\bcokolad|\bchocolate\b/,'Čokoláda'],[/\bmak\b|\bmakov/,'Mák'],[/\bsyrovat|\bwhey\b/,'Syrovátka']]
  return simple.find(([re])=>re.test(n))?.[1]??null
}
export function automaticIngredients(name){
  const n=plain(name),found=[]
  const add=s=>{if(!found.includes(s))found.push(s)}
  if(/quesadill/.test(n)){add('Mouka');add('Sýr')}
  if(/cheeseburger/.test(n)){add('Mouka');add('Sýr');add('Maso')}
  else if(/\bburger\b/.test(n)){add('Mouka');add('Maso')}
  if(/pizza|pernik|kolac|buchta|strudl|zavin|palacink|livanc|knedlik|gnocchi|tortill|testovin|spaget|nudl|rohlik|housk|chleb|ciabatt|baget|toast|susen|biscuit|cookies/.test(n))add('Mouka')
  for(const [re,label] of [[/s mlekem|\bmleko\b/,'Mléko'],[/\bmasl\w*/,'Máslo'],[/smetan/,'Smetana'],[/tvaroh/,'Tvaroh'],[/syrem|syru|\bsyr\b/,'Sýr'],[/kurec/,'Kuřecí maso'],[/veprov/,'Vepřové maso'],[/hovez/,'Hovězí maso'],[/jablecn/,'Jablko'],[/brambor/,'Brambory'],[/vajec|vejce|volske oko/,'Vejce'],[/makov/,'Mák'],[/cokolad|chocolate/,'Čokoláda']])if(re.test(n))add(label)
  if(/grilovana zelenina/.test(n))for(const [re,label] of [[/lilek/,'Lilek'],[/cuketa/,'Cuketa'],[/paprik/,'Paprika'],[/olej/,'Olej'],[/bylink/,'Bylinky']])if(re.test(n))add(label)
  if(!found.length){const single=generalIngredient(name);if(single)add(single)}
  return found.filter(label=>!((label==='Mouka'&&/bez mouky/.test(n))||(label==='Vejce'&&/bez vajec|bezvajec/.test(n))||(label==='Mléko'&&/bez mleka/.test(n))||(label==='Máslo'&&/bez masla/.test(n))||(label==='Smetana'&&/bez smetany/.test(n)))).map(label=>label==='Mouka'&&glutenFree(n)?'Bezlepková mouka':['Mléko','Smetana','Sýr','Tvaroh','Máslo','Jogurt'].includes(label)?dairy(label,n):label)
}
export function readIngredientRules(storage=typeof localStorage==='undefined'?undefined:localStorage){
  const raw=storage?.getItem(KEY)??null
  if(raw===null)return {version:1,items:{}}
  const d=JSON.parse(raw)
  if(!d||d.version!==1||!d.items||typeof d.items!=='object'||Array.isArray(d.items))throw new Error('Neplatná pravidla složení.')
  for(const r of Object.values(d.items))if(!r||!['manual','off'].includes(r.mode)||!Array.isArray(r.names)||!r.names.every(n=>typeof n==='string'&&n.trim()))throw new Error('Neplatný rozklad jídla.')
  return d
}
export function writeIngredientRule(name,mode,names=[],storage=localStorage){
  const key=ingredientKey(name);if(!key||key.length>300||!['auto','manual','off'].includes(mode))throw new Error('Vyber jídlo a platný režim.')
  const clean=[...new Set(names.map(n=>n.trim()).filter(Boolean))]
  if(clean.length>100||clean.some(n=>n.length>160)||(mode==='manual'&&!clean.length))throw new Error('Zadej 1 až 100 surovin, každou do 160 znaků.')
  const d=readIngredientRules(storage),items={...d.items}
  if(mode==='auto')delete items[key];else items[key]={mode,names:mode==='off'?[]:clean,updatedAt:new Date().toISOString()}
  const next={version:1,items};storage.setItem(KEY,JSON.stringify(next));return next
}
export function resolveIngredients(item,rules={version:1,items:{}}){
  const explicit=item.ingredients??[],rule=rules.items[ingredientKey(item.name)]
  const source=explicit.length?'pdf':rule?.mode==='manual'?'manual':rule?.mode==='off'?'off':'automatic'
  const inputs=source==='pdf'?explicit:source==='manual'?rule.names.map(name=>({name,amount:''})):source==='off'?[]:automaticIngredients(item.name).map(name=>({name,amount:''}))
  return {source,ingredients:inputs.map(i=>({name:generalIngredient(i.name)??i.name,amount:i.amount??'',originName:i.name,originFood:item.name,ingredientSource:source}))}
}
export function ingredientSlots(slots,rules){return slots.map(slot=>({...slot,items:slot.items.map(item=>({...item,ingredients:resolveIngredients(item,rules).ingredients}))}))}
