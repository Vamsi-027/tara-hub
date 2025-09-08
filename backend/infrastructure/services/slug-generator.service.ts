/**
 * Slug Generator Service Implementation
 * Infrastructure layer - implements slug generator interface
 * Single Responsibility: URL-friendly slug generation and validation
 */

import { ISlugGenerator } from '../../application/interfaces/services/slug-generator.service.interface';

export class SlugGeneratorService implements ISlugGenerator {
  private readonly maxLength: number;
  private readonly separator: string;

  constructor(maxLength: number = 100, separator: string = '-') {
    this.maxLength = maxLength;
    this.separator = separator;
  }

  generate(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let slug = text
      .toLowerCase()
      .trim()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, this.separator)
      .replace(new RegExp(`^${this.separator}+|${this.separator}+$`, 'g'), '');

    if (slug.length > this.maxLength) {
      slug = slug.substring(0, this.maxLength);
      const lastSeparator = slug.lastIndexOf(this.separator);
      if (lastSeparator > this.maxLength * 0.8) {
        slug = slug.substring(0, lastSeparator);
      }
    }

    return slug || 'untitled';
  }

  isValid(slug: string): boolean {
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    if (slug.length === 0 || slug.length > this.maxLength) {
      return false;
    }

    const validPattern = new RegExp(`^[a-z0-9]+(?:${this.separator}[a-z0-9]+)*$`);
    return validPattern.test(slug);
  }

  generateUnique(baseText: string, existingCheck: (slug: string) => Promise<boolean>): Promise<string> {
    return this.generateUniqueSlug(baseText, existingCheck);
  }

  private async generateUniqueSlug(
    baseText: string, 
    existingCheck: (slug: string) => Promise<boolean>,
    counter: number = 0
  ): Promise<string> {
    const baseSlug = this.generate(baseText);
    const candidateSlug = counter === 0 ? baseSlug : `${baseSlug}${this.separator}${counter}`;

    const exists = await existingCheck(candidateSlug);
    
    if (!exists) {
      return candidateSlug;
    }

    return this.generateUniqueSlug(baseText, existingCheck, counter + 1);
  }

  sanitize(slug: string): string {
    if (!this.isValid(slug)) {
      return this.generate(slug);
    }
    return slug;
  }
}

export class AdvancedSlugGenerator extends SlugGeneratorService {
  private readonly reservedWords: Set<string>;

  constructor(
    maxLength: number = 100,
    separator: string = '-',
    reservedWords: string[] = []
  ) {
    super(maxLength, separator);
    this.reservedWords = new Set([
      ...reservedWords,
      'admin', 'api', 'www', 'app', 'create', 'edit', 'delete', 'new',
      'search', 'index', 'home', 'about', 'contact', 'login', 'logout',
      'register', 'profile', 'settings', 'help', 'support', 'terms',
      'privacy', 'cookies', 'sitemap', 'robots', 'favicon'
    ]);
  }

  generate(text: string): string {
    let slug = super.generate(text);

    if (this.reservedWords.has(slug)) {
      slug = `${slug}-item`;
    }

    return slug;
  }

  isValid(slug: string): boolean {
    if (!super.isValid(slug)) {
      return false;
    }

    if (this.reservedWords.has(slug)) {
      return false;
    }

    if (/^\d+$/.test(slug)) {
      return false;
    }

    return true;
  }
}

export class FabricSlugGenerator extends AdvancedSlugGenerator {
  constructor() {
    super(80, '-', ['fabric', 'material', 'textile', 'cloth']);
  }

  generateFromFabric(name: string, manufacturerName?: string, collection?: string): string {
    const parts = [name];
    
    if (manufacturerName) {
      parts.unshift(manufacturerName);
    }
    
    if (collection) {
      parts.push(collection);
    }

    const combinedText = parts.join(' ');
    return this.generate(combinedText);
  }

  generateFromSku(sku: string): string {
    return this.generate(sku);
  }
}