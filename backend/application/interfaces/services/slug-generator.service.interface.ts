/**
 * Slug Generator Service Interface
 * Abstracts URL-friendly slug generation
 */

export interface ISlugGenerator {
  generate(text: string): string;
  isValid(slug: string): boolean;
}