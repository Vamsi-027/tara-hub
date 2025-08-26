/**
 * Event Bus Publisher Implementation
 * Infrastructure layer - implements domain event publisher interface
 * Single Responsibility: Event publishing with different strategies
 */

import { IDomainEventPublisher } from '../../../application/interfaces/services/domain-event-publisher.interface';
import { DomainEvent } from '../../../domain/events/base.event';
import { Result } from '../../../shared/utils/result.util';

export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: IEventHandler<T>): void;
  unsubscribe(eventType: string, handler: IEventHandler): void;
}

export class InMemoryEventBus implements IEventBus, IDomainEventPublisher {
  private readonly handlers = new Map<string, Set<IEventHandler>>();
  private readonly eventQueue: DomainEvent[] = [];
  private isProcessing = false;

  async publish(event: DomainEvent): Promise<void> {
    this.eventQueue.push(event);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.eventQueue.push(...events);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: IEventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as IEventHandler);
  }

  unsubscribe(eventType: string, handler: IEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      await this.handleEvent(event);
    }

    this.isProcessing = false;
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventType}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

export class AsyncEventPublisher implements IDomainEventPublisher {
  private readonly eventQueue: DomainEvent[] = [];
  private readonly batchSize: number;
  private readonly flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    private readonly eventBus: IEventBus,
    batchSize: number = 10,
    flushInterval: number = 1000
  ) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }

  async publish(event: DomainEvent): Promise<void> {
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.eventQueue.push(...events);
    
    if (this.eventQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = this.eventQueue.splice(0, this.eventQueue.length);
    
    try {
      await this.eventBus.publishAll(eventsToProcess);
    } catch (error) {
      console.error('Error flushing events:', error);
      this.eventQueue.unshift(...eventsToProcess);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush().catch(console.error);
  }
}

export class EventPublisherWithRetry implements IDomainEventPublisher {
  constructor(
    private readonly publisher: IDomainEventPublisher,
    private readonly maxRetries: number = 3,
    private readonly retryDelay: number = 1000
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.publisher.publish(event);
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    console.error(`Failed to publish event after ${this.maxRetries} attempts:`, lastError);
    throw lastError;
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.publisher.publishAll(events);
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    console.error(`Failed to publish events after ${this.maxRetries} attempts:`, lastError);
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}