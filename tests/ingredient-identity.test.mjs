import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalIngredient } from '../src/ingredient-identity.mjs'

test('aliases share stable ingredient IDs', () => {
  assert.equal(canonicalIngredient('  GOUDA  ').id, 'ingredient:cheese')
  assert.equal(canonicalIngredient('sýr strouhaný').id, 'ingredient:cheese')
  assert.equal(canonicalIngredient('Pšeničná mouka hladká').id, 'ingredient:flour')
  assert.equal(canonicalIngredient('smetana 12%').id, canonicalIngredient('Smetana ke šlehání').id)
})
test('explicit lactose and gluten variants remain separate', () => {
  assert.equal(canonicalIngredient('bezlaktózové mléko').id, 'ingredient:milk:lactose-free')
  assert.equal(canonicalIngredient('Mléko bez laktózy').id, 'ingredient:milk:lactose-free')
  assert.notEqual(canonicalIngredient('Mléko bez laktózy').id, canonicalIngredient('Mléko').id)
  assert.equal(canonicalIngredient('Rýžová mouka').id, 'ingredient:flour-gluten-free')
  assert.notEqual(canonicalIngredient('Bezlepková mouka').id, canonicalIngredient('Mouka').id)
})
test('whole dishes and unknown branded products are not guessed from substrings', () => {
  for (const name of ['Bramborová kaše s mlékem', 'Sýrová omáčka', 'Mléko značky XYZ', 'Máslo arašídové']) {
    assert.equal(canonicalIngredient(name).matched, false)
  }
})
test('unknown names normalize whitespace, case and Unicode without destructive accent folding', () => {
  assert.equal(canonicalIngredient('  BIO   sirup ').id, canonicalIngredient('bio sirup').id)
  assert.equal(canonicalIngredient('Neznámá přísada').id, canonicalIngredient('Neznámá přísada'.normalize('NFD')).id)
  assert.notEqual(canonicalIngredient('máta').id, canonicalIngredient('mata').id)
  assert.equal(canonicalIngredient('   '), null)
  assert.throws(() => canonicalIngredient(null), TypeError)
})
