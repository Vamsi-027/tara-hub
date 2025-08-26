/**
 * Domain Exceptions
 * Business rule violations and domain-specific errors
 */

export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || this.constructor.name;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Generic domain exceptions
export class InvalidOperationException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION');
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

export class ValidationException extends DomainException {
  public readonly validationErrors: Record<string, string[]>;

  constructor(message: string, validationErrors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }
}

// Fabric-specific exceptions
export class FabricNotFoundException extends DomainException {
  constructor(identifier: string, identifierType: 'id' | 'sku' | 'slug' = 'id') {
    super(`Fabric not found with ${identifierType}: ${identifier}`, 'FABRIC_NOT_FOUND');
  }
}

export class DuplicateFabricException extends DomainException {
  constructor(field: string, value: string) {
    super(`Fabric with ${field} '${value}' already exists`, 'DUPLICATE_FABRIC');
  }
}

export class InsufficientStockException extends DomainException {
  constructor(available: number, requested: number, unit: string = '') {
    super(
      `Insufficient stock. Available: ${available}${unit}, Requested: ${requested}${unit}`,
      'INSUFFICIENT_STOCK'
    );
  }
}

export class InvalidPricingException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_PRICING');
  }
}

export class FabricAlreadyDeletedException extends DomainException {
  constructor(fabricId: string) {
    super(`Fabric ${fabricId} is already deleted`, 'FABRIC_ALREADY_DELETED');
  }
}

export class CannotModifyDeletedFabricException extends DomainException {
  constructor(fabricId: string) {
    super(`Cannot modify deleted fabric ${fabricId}`, 'CANNOT_MODIFY_DELETED_FABRIC');
  }
}

// User/Auth exceptions
export class UserNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN');
  }
}

export class InvalidTokenException extends DomainException {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 'INVALID_TOKEN');
  }
}

// Infrastructure exceptions (for domain to handle gracefully)
export class ExternalServiceException extends DomainException {
  public readonly serviceName: string;

  constructor(serviceName: string, message: string) {
    super(`External service error [${serviceName}]: ${message}`, 'EXTERNAL_SERVICE_ERROR');
    this.serviceName = serviceName;
  }
}

export class DatabaseException extends DomainException {
  constructor(message: string, operation?: string) {
    const fullMessage = operation ? `Database operation '${operation}' failed: ${message}` : message;
    super(fullMessage, 'DATABASE_ERROR');
  }
}

export class CacheException extends DomainException {
  constructor(message: string) {
    super(`Cache operation failed: ${message}`, 'CACHE_ERROR');
  }
}