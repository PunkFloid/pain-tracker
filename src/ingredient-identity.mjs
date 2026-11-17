export const INGREDIENT_IDENTITY_VERSION = 1
export const normalizeIngredientName = name => name.normalize('NFC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('cs-CZ')
const lookupName = name => normalizeIngredientName(name).normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
const definitions = [
  ['flour', 'Mouka', ['mouka', 'pšeničná mouka', 'hladká mouka', 'pšeničná mouka hladká', 'špaldová mouka', 'žitná mouka']],
  ['flour-gluten-free', 'Bezlepková mouka', ['bezlepková mouka', 'mouka bez lepku', 'rýžová mouka', 'kukuřičná mouka']],
  ['cheese', 'Sýr', ['sýr', 'sýr strouhaný', 'strouhaný sýr', 'eidam', 'gouda', 'mozzarella', 'čedar', 'cheddar', 'parmazán']],
  ['milk', 'Mléko', ['mléko', 'plnotučné mléko', 'polotučné mléko']],
  ['cream', 'Smetana', ['smetana', 'smetana 12 %', 'smetana 12%', 'smetana 33 %', 'smetana 33%', 'smetana ke šlehání', 'smetana na vaření']],
  ['butter', 'Máslo', ['máslo']],
  ['curd', 'Tvaroh', ['tvaroh', 'měkký tvaroh', 'nízkotučný tvaroh', 'polotučný tvaroh', 'tučný tvaroh']],
  ['yogurt', 'Jogurt', ['jogurt', 'bílý jogurt', 'skyr']],
  ['eggs', 'Vejce', ['vejce', 'vejce slepičí', 'žloutek', 'bílek']],
  ['potato', 'Brambory', ['brambory', 'brambor']],
  ['chicken', 'Kuřecí maso', ['kuřecí maso', 'kuřecí prsa']],
  ['pork', 'Vepřové maso', ['vepřové maso']],
  ['beef', 'Hovězí maso', ['hovězí maso']]
]
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
