import type { MealSlot } from './food-parser.mjs'
import type { Pain } from './db'
import type { DayCheckRecord } from './day-check-logic.mjs'
export type FollowStatus='free'|'pain'|'running'|'unknown'
export type Occasion={day:string;category:string;from:number;mealEnd:number;until:number;amounts:string[]}
export type FollowGroup={from:number;until:number;exposures:Occasion[];status:FollowStatus;painBefore:boolean;painIds:string[];missingDays:string[]}
export type FollowRow={key:string;name:string;days:number;occasions:number;groups:FollowGroup[];free:number;pain:number;running:number;unknown:number}
export function followUp(slots:MealSlot[],pains:Pain[],checks:DayCheckRecord[],kind?:'food'|'ingredient',zone?:string,now?:number,merge?:boolean):FollowRow[]
