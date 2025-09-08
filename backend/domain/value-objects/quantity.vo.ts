/**
 * Quantity Value Object
 * Handles stock quantities with units and business rules
 */

import { ValueObject } from './base.vo';
import { ValidationException, InsufficientStockException } from '../exceptions/domain.exceptions';

interface QuantityValue {
  amount: number;
  unit: string;
}

export class Quantity extends ValueObject<QuantityValue> {
  private static readonly SUPPORTED_UNITS = ['yards', 'meters', 'pieces', 'rolls', 'sqft', 'sqm'];
  private static readonly MAX_QUANTITY = 100000;
  private static readonly PRECISION = 3; // 3 decimal places for fabric measurements

  protected validate(value: QuantityValue): void {
    if (!value || typeof value !== 'object') {
      throw new ValidationException('Quantity value must be an object with amount and unit');
    }

    const { amount, unit } = value;

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationException('Quantity amount must be a valid number');
    }

    if (amount < 0) {
      throw new ValidationException('Quantity amount cannot be negative');
    }

    if (amount > Quantity.MAX_QUANTITY) {
      throw new ValidationException(`Quantity amount cannot exceed ${Quantity.MAX_QUANTITY}`);
    }

    // Validate unit
    if (!unit || typeof unit !== 'string') {
      throw new ValidationException('Quantity unit must be a valid string');
    }

    if (!Quantity.SUPPORTED_UNITS.includes(unit.toLowerCase())) {
      throw new ValidationException(
        `Unsupported unit '${unit}'. Supported: ${Quantity.SUPPORTED_UNITS.join(', ')}`
      );
    }

    // Check precision
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > Quantity.PRECISION) {
      throw new ValidationException(`Amount cannot have more than ${Quantity.PRECISION} decimal places`);
    }
  }

  static create(amount: number, unit: string = 'yards'): Quantity {
    return new Quantity({
      amount: Math.round(amount * 1000) / 1000, // Round to 3 decimal places
      unit: unit.toLowerCase()
    });
  }

  static zero(unit: string = 'yards'): Quantity {
    return Quantity.create(0, unit);
  }

  get amount(): number {
    return this._value.amount;
  }

  get unit(): string {
    return this._value.unit;
  }

  add(other: Quantity): Quantity {
    this.ensureSameUnit(other);
    return Quantity.create(this.amount + other.amount, this.unit);
  }

  subtract(other: Quantity): Quantity {
    this.ensureSameUnit(other);
    const result = this.amount - other.amount;
    
    if (result < 0) {
      throw new InsufficientStockException(this.amount, other.amount, this.unit);
    }
    
    return Quantity.create(result, this.unit);
  }

  multiply(factor: number): Quantity {
    if (typeof factor !== 'number' || isNaN(factor) || factor < 0) {
      throw new ValidationException('Multiplication factor must be a positive number');
    }
    
    return Quantity.create(this.amount * factor, this.unit);
  }

  divide(divisor: number): Quantity {
    if (typeof divisor !== 'number' || isNaN(divisor) || divisor <= 0) {
      throw new ValidationException('Division divisor must be a positive number');
    }
    
    return Quantity.create(this.amount / divisor, this.unit);
  }

  isGreaterThan(other: Quantity): boolean {
    this.ensureSameUnit(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Quantity): boolean {
    this.ensureSameUnit(other);
    return this.amount < other.amount;
  }

  isEqual(other: Quantity): boolean {
    this.ensureSameUnit(other);
    return this.amount === other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isSufficient(required: Quantity): boolean {
    this.ensureSameUnit(required);
    return this.amount >= required.amount;
  }

  format(): string {
    return `${this.amount} ${this.unit}`;
  }

  toJSON() {
    return {
      amount: this.amount,
      unit: this.unit,
      formatted: this.format()
    };
  }

  // Unit conversions (basic examples)
  convertToMeters(): Quantity {
    switch (this.unit) {
      case 'yards':
        return Quantity.create(this.amount * 0.9144, 'meters');
      case 'sqft':
        return Quantity.create(this.amount * 0.092903, 'sqm');
      case 'meters':
      case 'sqm':
        return this;
      default:
        throw new ValidationException(`Cannot convert ${this.unit} to meters`);
    }
  }

  convertToYards(): Quantity {
    switch (this.unit) {
      case 'meters':
        return Quantity.create(this.amount * 1.09361, 'yards');
      case 'sqm':
        return Quantity.create(this.amount * 10.7639, 'sqft');
      case 'yards':
      case 'sqft':
        return this;
      default:
        throw new ValidationException(`Cannot convert ${this.unit} to yards`);
    }
  }

  private ensureSameUnit(other: Quantity): void {
    if (this.unit !== other.unit) {
      throw new ValidationException(
        `Unit mismatch: ${this.unit} vs ${other.unit}`
      );
    }
  }

  equals(other: Quantity): boolean {
    return super.equals(other);
  }

  toString(): string {
    return this.format();
  }
}