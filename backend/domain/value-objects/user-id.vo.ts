/**
 * User ID Value Object
 * Type-safe identifier for user entities
 */

import { ValueObject } from './base.vo';
import { ValidationException } from '../exceptions/domain.exceptions';

export class UserId extends ValueObject<string> {
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  protected validate(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationException('User ID must be a non-empty string');
    }

    if (id.trim().length === 0) {
      throw new ValidationException('User ID cannot be empty');
    }

    // Allow both UUIDs and legacy string IDs for backward compatibility
    if (id.length === 36 && !UserId.UUID_REGEX.test(id)) {
      throw new ValidationException('Invalid UUID format for User ID');
    }

    if (id.length > 255) {
      throw new ValidationException('User ID cannot exceed 255 characters');
    }
  }

  static create(id: string): UserId {
    return new UserId(id);
  }

  static generate(): UserId {
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    return new UserId(uuid);
  }

  isUUID(): boolean {
    return UserId.UUID_REGEX.test(this._value);
  }

  equals(other: UserId): boolean {
    return super.equals(other);
  }

  toString(): string {
    return this._value;
  }
}