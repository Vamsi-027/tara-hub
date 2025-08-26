/**
 * Base Value Object
 * Immutable objects that represent domain concepts
 */

export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = Object.freeze(this.deepClone(value));
  }

  protected abstract validate(value: T): void;

  get value(): T {
    return this._value;
  }

  equals(other: ValueObject<T>): boolean {
    if (this === other) return true;
    if (!(other instanceof this.constructor)) return false;
    
    return this.deepEquals(this._value, other._value);
  }

  toString(): string {
    return JSON.stringify(this._value);
  }

  private deepClone(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as T;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => this.deepEquals(val, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEquals(a[key], b[key]));
    }
    return false;
  }
}