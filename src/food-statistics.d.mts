import type { MealSlot } from './food-parser.mjs'
import type { Pain } from './db'
export type StatisticHit={painId:string;start:string;status:'inside'|'possible'}
export type StatisticRow={key:string;name:string;days:number;hits:StatisticHit[];inside:number;possible:number;total:number}
export type StatisticsResult={totalPains:number;eligible:number;partial:number;noData:number;incomplete:number;importedDays:number;rows:StatisticRow[]}
export function foodStatistics(slots:MealSlot[],pains:Pain[],kind:'food'|'ingredient',olderHours:number,newerHours:number,includePartial?:boolean):StatisticsResult
