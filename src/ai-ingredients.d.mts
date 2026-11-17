export const AI_INGREDIENTS_VERSION: number
export const AI_INGREDIENTS_INSTRUCTIONS: string
export type AiIngredientRequest = { version: 1; foodKey: string; foodName: string; knownIngredients: string[] }
export type AiIngredientProposal = { version: 1; requestKey: string; foodKey: string; ingredients: { name: string; basis: 'named'|'typical'; evidence: 'inferred'; ingredientSource: 'ai' }[]; needsReview: boolean; completeness: 'unknown' }
export function createAiIngredientRequest(item: {name:string;ingredients?:{name:string}[]}): AiIngredientRequest
export function aiIngredientRequestKey(request: AiIngredientRequest): string
export function parseAiIngredientProposal(input: unknown, request: AiIngredientRequest): AiIngredientProposal
