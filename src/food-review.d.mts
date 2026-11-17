import type { FollowRow } from './follow-up.mjs'
export type FoodStatus='watch'|'ok'|'suspect'
export type FoodReview={status?:FoodStatus;note:string;updatedAt:string}
export type FoodReviews={version:1;items:Record<string,FoodReview>}
export function parseFoodReviews(text:string|null):FoodReviews
export function parseDeferred(text:string|null):string[]
export function readFoodReviews(storage?:Pick<Storage,'getItem'>):FoodReviews
export function writeFoodReview(id:string,patch:{status?:FoodStatus;note?:string},storage?:Pick<Storage,'getItem'|'setItem'>):FoodReviews
export function episodeIds(row:FollowRow):string[]
