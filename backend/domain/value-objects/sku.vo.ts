/**
 * SKU Value Object
 * Stock Keeping Unit with business rules
 */

import { ValueObject } from './base.vo';
import { ValidationException } from '../exceptions/domain.exceptions';

export class SKU extends ValueObject<string> {
  private static readonly SKU_REGEX = /^[A-Z0-9][A-Z0-9\-]{1,48}[A-Z0-9]$/;
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 50;

  protected validate(sku: string): void {
    if (!sku || typeof sku !== 'string') {
      throw new ValidationException('SKU must be a non-empty string');
    }

    const trimmedSku = sku.trim().toUpperCase();

    if (trimmedSku.length < SKU.MIN_LENGTH) {
      throw new ValidationException(`SKU must be at least ${SKU.MIN_LENGTH} characters long`);
    }

    if (trimmedSku.length > SKU.MAX_LENGTH) {
      throw new ValidationException(`SKU cannot exceed ${SKU.MAX_LENGTH} characters`);
    }

    if (!SKU.SKU_REGEX.test(trimmedSku)) {
      throw new ValidationException(
        'SKU must contain only alphanumeric characters and hyphens, starting and ending with alphanumeric characters'
      );
    }

    // Business rule: No consecutive hyphens
    if (trimmedSku.includes('--')) {
      throw new ValidationException('SKU cannot contain consecutive hyphens');
    }
  }

  static create(sku: string): SKU {
    // Normalize to uppercase
    const normalizedSku = sku.trim().toUpperCase();
    return new SKU(normalizedSku);
  }

  static generate(prefix: string, suffix?: string): SKU {
    if (!prefix || prefix.length < 2) {
      throw new ValidationException('SKU prefix must be at least 2 characters');
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    
    let sku = `${prefix.toUpperCase()}-${timestamp}-${random}`;
    
    if (suffix) {
      sku += `-${suffix.toUpperCase()}`;
    }

    return SKU.create(sku);
  }

  getPrefix(): string {
    const parts = this._value.split('-');
    return parts[0];
  }

  isGenerated(): boolean {
    // Check if SKU follows generated pattern (at least 3 parts)
    const parts = this._value.split('-');
    return parts.length >= 3 && parts[1].length >= 6;
  }

  equals(other: SKU): boolean {
    return super.equals(other);
  }

  toString(): string {
    return this._value;
  }
}