import type { Pain, Medication } from './db'
export function medicationsForPain(pain:Pain,medications:Medication[],now?:number):Medication[]
export function painMedicationStatus(pain:Pain,medications:Medication[],now?:number):'treated'|'pending'|'untreated'
