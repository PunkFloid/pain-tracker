export const INGREDIENT_IDENTITY_VERSION = 1
export const normalizeIngredientName = name => name.normalize('NFC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('cs-CZ')
const lookupName = name => normalizeIngredientName(name).normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
const definitions = [
  ['flour', 'Mouka', ['mouka', 'pšeničná mouka', 'hladká mouka', 'pšeničná mouka hladká', 'špaldová mouka', 'žitná mouka', 'flour', 'wheat flour', 'plain flour', 'all-purpose flour', 'spelt flour', 'rye flour']],
  ['flour-gluten-free', 'Bezlepková mouka', ['bezlepková mouka', 'mouka bez lepku', 'rýžová mouka', 'kukuřičná mouka', 'gluten-free flour', 'gluten free flour', 'rice flour', 'corn flour']],
  ['cheese', 'Sýr', ['sýr', 'sýr strouhaný', 'strouhaný sýr', 'eidam', 'gouda', 'mozzarella', 'čedar', 'cheddar', 'parmazán', 'cheese', 'grated cheese', 'parmesan']],
  ['milk', 'Mléko', ['mléko', 'plnotučné mléko', 'polotučné mléko', 'milk', 'whole milk', 'semi-skimmed milk']],
  ['cream', 'Smetana', ['smetana', 'smetana 12 %', 'smetana 12%', 'smetana 33 %', 'smetana 33%', 'smetana ke šlehání', 'smetana na vaření', 'cream', 'whipping cream', 'heavy cream', 'cooking cream']],
  ['butter', 'Máslo', ['máslo', 'butter']],
  ['curd', 'Tvaroh', ['tvaroh', 'měkký tvaroh', 'nízkotučný tvaroh', 'polotučný tvaroh', 'tučný tvaroh', 'quark']],
  ['yogurt', 'Jogurt', ['jogurt', 'bílý jogurt', 'skyr', 'yogurt', 'yoghurt', 'plain yogurt', 'plain yoghurt']],
  ['eggs', 'Vejce', ['vejce', 'vejce slepičí', 'žloutek', 'bílek', 'egg', 'eggs', 'egg yolk', 'egg white']],
  ['potato', 'Brambory', ['brambory', 'brambor', 'potato', 'potatoes']],
  ['chicken', 'Kuřecí maso', ['kuřecí maso', 'kuřecí prsa', 'chicken', 'chicken meat', 'chicken breast', 'chicken breasts']],
  ['pork', 'Vepřové maso', ['vepřové maso', 'pork']],
  ['beef', 'Hovězí maso', ['hovězí maso', 'beef']]
]
// New labels retain the raw Czech IDs already used by existing data.
const translations = [
  ['Rýže', ['rice']], ['Cibule', ['onion', 'onions']], ['Česnek', ['garlic']],
  ['Mrkev', ['carrot', 'carrots']], ['Rajče', ['tomato', 'tomatoes']],
  ['Paprika', ['bell pepper', 'bell peppers']], ['Špenát', ['spinach']],
  ['Cuketa', ['zucchini', 'courgette']], ['Lilek', ['eggplant', 'aubergine']],
  ['Brokolice', ['broccoli']], ['Květák', ['cauliflower']], ['Okurka', ['cucumber']],
  ['Banán', ['banana', 'bananas']], ['Jablko', ['apple', 'apples']],
  ['Cukr', ['sugar']], ['Sůl', ['salt']], ['Olej', ['oil']],
  ['Olivový olej', ['olive oil']], ['Řepkový olej', ['rapeseed oil', 'canola oil']],
  ['Slunečnicový olej', ['sunflower oil']], ['Kakao', ['cocoa', 'cocoa powder']],
  ['Čokoláda', ['chocolate']], ['Mák', ['poppy seed', 'poppy seeds']],
  ['Syrovátka', ['whey']], ['Voda', ['water']], ['Med', ['honey']],
  ['Citron', ['lemon']], ['Citronová šťáva', ['lemon juice']],
  ['Losos', ['salmon']], ['Tuňák', ['tuna']], ['Krůtí maso', ['turkey', 'turkey meat']],
  ['Ovesné vločky', ['rolled oats', 'oat flakes']], ['Čočka', ['lentils']],
  ['Cizrna', ['chickpeas']], ['Hrášek', ['peas']], ['Sója', ['soy', 'soya']],
  ['Mandle', ['almonds']], ['Vlašské ořechy', ['walnuts']],
  ['Arašídy', ['peanuts']], ['Černý pepř', ['black pepper']],
  ['Bazalka', ['basil']], ['Oregano', []], ['Petržel', ['parsley']]
]
for (const [name, names] of translations) definitions.push(['raw:' + normalizeIngredientName(name), name, [name, ...names]])
const aliases = new Map()
for (const [id, name, names] of definitions) {
  for (const alias of names) {
    const key = lookupName(alias)
    if (aliases.has(key)) throw new Error('Duplicitní alias suroviny: ' + alias)
    aliases.set(key, { id: 'ingredient:' + id, name })
  }
}
const dairyIds = new Set(['milk', 'cream', 'cheese', 'butter', 'curd', 'yogurt'].map(id => 'ingredient:' + id))
export function canonicalIngredient(name) {
  if (typeof name !== 'string') throw new TypeError('Název suroviny musí být text.')
  const normalized = normalizeIngredientName(name)
  if (!normalized) return null
  const direct = aliases.get(lookupName(name))
  if (direct) return { ...direct, matched: true }
  const plain = lookupName(name)
  const withoutLactose = plain.replace(/\b(?:bezlaktozove|bezlaktozova|bezlaktozovy|bez laktozy|lactose[ -]?free|lactofree)\b/gu, ' ').replace(/\s+/gu, ' ').trim()
  const dairy = aliases.get(withoutLactose)
  if (plain !== withoutLactose && dairy && dairyIds.has(dairy.id)) {
    return { id: dairy.id + ':lactose-free', name: dairy.name + ' bez laktózy', matched: true }
  }
  return { id: 'ingredient:raw:' + normalized, name: name.normalize('NFC').replace(/\s+/gu, ' ').trim(), matched: false }
}
