/**
 * Base Entity
 * Entities with identity and mutable state
 */

import { DomainEvent } from '../events/base.event';

export abstract class Entity<T> {
  protected readonly _id: T;
  protected _domainEvents: DomainEvent[] = [];

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  equals(other: Entity<T>): boolean {
    if (this === other) return true;
    if (!(other instanceof this.constructor)) return false;
    return this._id === other._id;
  }
}

/**
 * Aggregate Root
 * Entry point for domain operations
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  // Aggregate roots are the only entities that can be obtained directly from repositories
  // They maintain consistency boundaries for related entities
}

/**
 * Audit Fields Mixin
 */
export interface AuditFields {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

export abstract class AuditableEntity<T> extends Entity<T> implements AuditFields {
  public readonly createdAt: Date;
  public updatedAt: Date;
  public readonly createdBy?: string;
  public updatedBy?: string;
  public deletedAt?: Date;
  public deletedBy?: string;

  constructor(id: T, auditFields: AuditFields) {
    super(id);
    this.createdAt = auditFields.createdAt;
    this.updatedAt = auditFields.updatedAt;
    this.createdBy = auditFields.createdBy;
    this.updatedBy = auditFields.updatedBy;
    this.deletedAt = auditFields.deletedAt;
    this.deletedBy = auditFields.deletedBy;
  }

  protected updateAudit(updatedBy?: string): void {
    this.updatedAt = new Date();
    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
  }

  protected markDeleted(deletedBy?: string): void {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.updateAudit(deletedBy);
  }

  get isDeleted(): boolean {
    return !!this.deletedAt;
  }
}