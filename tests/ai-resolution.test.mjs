import test from 'node:test'
import assert from 'node:assert/strict'
import { createAiIngredientRequest } from '../src/ai-ingredients.mjs'
import { saveAiIngredientProposal,readAiIngredientCache } from '../src/ai-ingredient-cache.mjs'
import { resolveIngredients } from '../src/ingredient-resolution.mjs'
import { filterIngredientEvidence } from '../src/ingredient-evidence.mjs'
const food=(name='Hnědá omáčka',ingredients=[])=>({name,ingredients,amount:'100 g',kcal:100})
function cache(needsReview=false){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},request=createAiIngredientRequest(food());saveAiIngredientProposal(request,{version:1,foodKey:request.foodKey,ingredients:[{name:'Cibule',basis:'typical'}],needsReview},storage);return readAiIngredientCache(storage)}
test('cached AI fallback becomes an inferred canonical ingredient',()=>{
  const result=resolveIngredients(food(),undefined,cache())
  assert.equal(result.source,'ai')
  assert.equal(result.ingredients[0].name,'Cibule')
  assert.equal(result.ingredients[0].evidence,'inferred')
  assert.equal(result.ingredients[0].ingredientSource,'ai')
  assert.deepEqual(result.ingredients[0].provenancePaths[0].path,['Hnědá omáčka','Cibule'])
  const slots=[{items:[{ingredients:result.ingredients}]}]
  assert.equal(filterIngredientEvidence(slots,false)[0].items[0].ingredients.length,0)
})
test('review-required proposal never enters analysis',()=>{
  const result=resolveIngredients(food(),undefined,cache(true))
  assert.deepEqual(result.ingredients,[])
  assert.equal(result.completeness,'unknown')
})
test('manual and imported composition override cached AI',()=>{
  const rules={version:1,items:{'hnědá omáčka':{mode:'manual',names:['Mléko']}}}
  assert.equal(resolveIngredients(food(),rules,cache()).source,'manual')
  assert.equal(resolveIngredients(food('Hnědá omáčka',[{name:'Mléko',amount:'20 ml'}]),undefined,cache()).source,'pdf')
})
test('disabled root does not reappear through AI and empty cache is harmless',()=>{
  const rules={version:1,items:{'hnědá omáčka':{mode:'off',names:[]}}}
  assert.deepEqual(resolveIngredients(food(),rules,cache()).ingredients,[])
  assert.deepEqual(resolveIngredients(food(),undefined,{version:1,items:{}}).ingredients,[])
})
