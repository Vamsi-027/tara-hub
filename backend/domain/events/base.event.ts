/**
 * Base Domain Event
 * All domain events extend this base class
 */

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly version: number;

  constructor(eventType: string, aggregateId: string, version: number = 1) {
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  abstract serialize(): Record<string, any>;

  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      version: this.version,
      data: this.serialize()
    };
  }
}

/**
 * Domain Event Handler Interface
 */
export interface IDomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Domain Event Publisher Interface
 */
export interface IDomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * Domain Event Store Interface
 */
export interface IDomainEventStore {
  store(event: DomainEvent): Promise<void>;
  getEventsForAggregate(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getAllEvents(fromEventId?: string): Promise<DomainEvent[]>;
}