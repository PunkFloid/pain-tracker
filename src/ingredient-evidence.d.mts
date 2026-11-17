import type { MealSlot } from './food-parser.mjs'
export function readIncludeInferred(storage?: Pick<Storage,'getItem'>): boolean
export function writeIncludeInferred(value: boolean, storage?: Pick<Storage,'setItem'>): void
export function filterIngredientEvidence(slots: MealSlot[], includeInferred?: boolean): MealSlot[]
