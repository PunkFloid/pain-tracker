import type { FoodReview, FoodReviews } from './food-review.mjs'
export type ReviewMigrationConflict = { target: string; reason: 'status' | 'note-length'; entries: { id: string; review: FoodReview }[] }
export type IngredientReviewMigration = { version: 1; reviews: FoodReviews; original: FoodReviews; aliases: Record<string, string>; conflicts: ReviewMigrationConflict[] }
export function canonicalReviewId(ingredientId: string): string
export function previewIngredientReviewMigration(reviews: FoodReviews): IngredientReviewMigration
