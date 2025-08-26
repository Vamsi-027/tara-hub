/**
 * Domain Event Publisher Interface
 * Abstracts event publishing mechanism
 */

import { DomainEvent } from '../../../domain/events/base.event';

export interface IDomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}