import type { AiIngredientProposal } from './ai-ingredients.mjs'
export const AI_INGREDIENT_ENDPOINT: string
export function requestAiIngredientProposal(item:{name:string;ingredients?:{name:string}[]},token:string,options?:{storage?:Pick<Storage,'getItem'|'setItem'>;fetcher?:typeof fetch;signal?:AbortSignal}):Promise<{proposal:AiIngredientProposal;fromCache:boolean}>
