/**
 * Money Value Object
 * Handles monetary values with currency and precision
 */

import { ValueObject } from './base.vo';
import { ValidationException, InvalidPricingException } from '../exceptions/domain.exceptions';

interface MoneyValue {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyValue> {
  private static readonly SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  private static readonly MAX_AMOUNT = 1000000; // $1M max for fabrics
  private static readonly PRECISION = 2; // 2 decimal places

  protected validate(value: MoneyValue): void {
    if (!value || typeof value !== 'object') {
      throw new ValidationException('Money value must be an object with amount and currency');
    }

    const { amount, currency } = value;

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationException('Amount must be a valid number');
    }

    if (amount < 0) {
      throw new InvalidPricingException('Amount cannot be negative');
    }

    if (amount > Money.MAX_AMOUNT) {
      throw new InvalidPricingException(`Amount cannot exceed ${Money.MAX_AMOUNT}`);
    }

    // Validate currency
    if (!currency || typeof currency !== 'string') {
      throw new ValidationException('Currency must be a valid string');
    }

    if (!Money.SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      throw new ValidationException(
        `Unsupported currency '${currency}'. Supported: ${Money.SUPPORTED_CURRENCIES.join(', ')}`
      );
    }

    // Check precision
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > Money.PRECISION) {
      throw new ValidationException(`Amount cannot have more than ${Money.PRECISION} decimal places`);
    }
  }

  static create(amount: number, currency: string = 'USD'): Money {
    return new Money({
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      currency: currency.toUpperCase()
    });
  }

  static zero(currency: string = 'USD'): Money {
    return Money.create(0, currency);
  }

  get amount(): number {
    return this._value.amount;
  }

  get currency(): string {
    return this._value.currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    
    if (result < 0) {
      throw new InvalidPricingException('Subtraction would result in negative amount');
    }
    
    return Money.create(result, this.currency);
  }

  multiply(factor: number): Money {
    if (typeof factor !== 'number' || isNaN(factor) || factor < 0) {
      throw new ValidationException('Multiplication factor must be a positive number');
    }
    
    return Money.create(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (typeof divisor !== 'number' || isNaN(divisor) || divisor <= 0) {
      throw new ValidationException('Division divisor must be a positive number');
    }
    
    return Money.create(this.amount / divisor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  isEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount === other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  format(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: Money.PRECISION,
      maximumFractionDigits: Money.PRECISION
    });

    return formatter.format(this.amount);
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
      formatted: this.format()
    };
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new InvalidPricingException(
        `Currency mismatch: ${this.currency} vs ${other.currency}`
      );
    }
  }

  equals(other: Money): boolean {
    return super.equals(other);
  }

  toString(): string {
    return this.format();
  }
}