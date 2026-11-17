import type { FollowRow, FollowGroup } from './follow-up.mjs'
import type { Pain } from './db'
import type { FoodReview, FoodReviews, FoodStatus } from './food-review.mjs'
import type { loadFollowUp } from './follow-up-store'
export type FoodProposal={type:'ok'|'suspect'|'recheck';target:FoodStatus;source:FoodStatus;name:string;key:string;completed:number;free:number;spanDays:number;episodeIds:string[];painRate:number;baselineRate:number|null;fingerprint:string}
export type NamedProposal=FoodProposal&{id:string;kind:'food'|'ingredient'}
export type SuggestionDecisions={version:1;items:Record<string,string>}
export const FOOD_RULES:Readonly<{version:number;minConsumptions:number;minSpanDays:number;minFreeFraction:number;minEpisodes:number;baseline:string}>
export function foodSuggestion(row:FollowRow,baseline:FollowGroup[],review:FoodReview|undefined,pains:Pain[],now?:number):FoodProposal|null
export function foodSuggestions(data:Awaited<ReturnType<typeof loadFollowUp>>,kind:'food'|'ingredient',reviews:FoodReviews,legacy:string[],zone:string,now?:number):NamedProposal[]
export function readSuggestionDecisions(storage?:Pick<Storage,'getItem'>):SuggestionDecisions
export function dismissFoodSuggestion(suggestion:NamedProposal,storage?:Pick<Storage,'getItem'|'setItem'>):SuggestionDecisions
