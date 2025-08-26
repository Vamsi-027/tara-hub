# Backend - Clean Architecture

## Overview

This backend follows **Clean Architecture** principles with Domain-Driven Design (DDD), SOLID principles, and comprehensive separation of concerns.

## Architecture Layers

```
backend/
├── domain/                 # Core business logic (no dependencies)
│   ├── entities/          # Business entities with behavior
│   ├── value-objects/     # Type-safe value objects
│   ├── events/            # Domain events
│   ├── repositories/      # Repository interfaces
│   └── exceptions/        # Domain-specific exceptions
│
├── application/            # Use cases and application logic
│   ├── use-cases/         # Business operations
│   ├── commands/          # Command DTOs (CQRS)
│   ├── queries/           # Query DTOs (CQRS)
│   ├── dto/               # Data transfer objects
│   ├── mappers/           # Entity ↔ DTO mappers
│   └── interfaces/        # Service interfaces
│
├── infrastructure/         # External concerns
│   ├── database/          # Database implementation
│   │   ├── repositories/  # Concrete repositories
│   │   ├── migrations/    # Database migrations
│   │   ├── schemas/       # Database schemas
│   │   └── connections/   # Database connections
│   ├── cache/             # Caching implementation
│   ├── events/            # Event publishing
│   └── services/          # External services
│
├── interfaces/             # API layer
│   ├── controllers/       # HTTP controllers
│   ├── middleware/        # Express/Next.js middleware
│   └── routes/            # Route definitions
│
└── shared/                 # Shared utilities
    ├── ioc/               # Dependency injection
    ├── constants/         # Shared constants
    └── utils/             # Utility functions
```

## Key Design Patterns

### 1. **Repository Pattern**
- Abstracts data access behind interfaces
- Domain layer depends only on interfaces
- Infrastructure provides concrete implementations

### 2. **Use Case Pattern**
- Each use case represents a single business operation
- Orchestrates domain logic and external services
- Returns Result<T> for safe error handling

### 3. **Value Objects**
- Replace primitive obsession
- Encapsulate validation and business rules
- Immutable by design

### 4. **Domain Events**
- Decouple side effects from business logic
- Enable event-driven architecture
- Support for event sourcing

### 5. **Result Pattern**
- Type-safe error handling
- No exceptions for business logic
- Clear success/failure paths

## Core Components

### Domain Layer

**Entities**
```typescript
// Rich domain model with business logic
class Fabric extends AggregateRoot {
  updateStock(operation, quantity) { /* business rules */ }
  updatePrice(newPrice) { /* validation & events */ }
}
```

**Value Objects**
```typescript
// Type-safe, validated values
class Money extends ValueObject {
  constructor(amount: number, currency: string)
  add(other: Money): Money
  isGreaterThan(other: Money): boolean
}
```

### Application Layer

**Use Cases**
```typescript
class CreateFabricUseCase {
  async execute(command: CreateFabricCommand): Promise<Result<Fabric>> {
    // Orchestrate creation with validation, slug generation, events
  }
}
```

**CQRS Commands/Queries**
```typescript
// Commands modify state
class UpdateStockCommand { fabricId, operation, quantity }

// Queries read state  
class SearchFabricsQuery { criteria, pagination, sorting }
```

### Infrastructure Layer

**Repository Implementation**
```typescript
class DrizzleFabricRepository implements IFabricRepository {
  async findById(id: FabricId): Promise<Result<Fabric>>
  async save(fabric: Fabric): Promise<Result<void>>
  // 25+ methods for data access
}
```

**Caching Strategy**
```typescript
class HybridCacheStrategy {
  // Primary: Redis
  // Fallback: Memory
  // Tag-based invalidation
}
```

### Interface Layer

**Controllers**
```typescript
class FabricController {
  async createFabric(req: NextRequest): Promise<NextResponse> {
    // HTTP handling → Use Case → Response
  }
}
```

**Middleware**
```typescript
// Authentication with JWT
// Request validation with Zod
// Error handling
```

## Dependency Injection

The IoC container manages all dependencies:

```typescript
const container = new Container({
  database: { url: process.env.DATABASE_URL },
  cache: { strategy: 'hybrid' },
  auth: { jwtSecret, adminEmails }
});

// Automatic service registration
container.registerSingleton('FabricRepository', () => new DrizzleFabricRepository(db));
container.registerSingleton('CreateFabricUseCase', () => new CreateFabricUseCase(...deps));
```

## API Endpoints

### Public Endpoints
- `GET /api/v1/fabrics` - Search fabrics
- `GET /api/v1/fabrics/:id` - Get fabric by ID
- `GET /api/v1/fabrics/sku/:sku` - Get fabric by SKU
- `GET /api/v1/fabrics/featured` - Get featured fabrics

### Admin Endpoints (Protected)
- `POST /api/v1/fabrics` - Create fabric
- `PUT /api/v1/fabrics/:id` - Update fabric
- `DELETE /api/v1/fabrics/:id` - Delete fabric
- `POST /api/v1/fabrics/:id/stock` - Update stock

## Benefits

1. **Testability**: All components are independently testable
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features without breaking existing code
4. **Type Safety**: Full TypeScript with value objects
5. **Error Handling**: Result pattern prevents unhandled exceptions
6. **Business Logic Protection**: Domain layer has no external dependencies

## Testing

```typescript
// Unit test example
describe('CreateFabricUseCase', () => {
  it('should create fabric with generated slug', async () => {
    const mockRepo = createMockRepository();
    const useCase = new CreateFabricUseCase(mockRepo, slugGen, eventBus);
    
    const result = await useCase.execute(command);
    
    expect(result.isSuccess()).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

## Migration from Legacy

The previous 830-line "God Object" `FabricService` has been decomposed into:
- 6 focused use cases
- Rich domain entity with business logic
- Clean repository interface
- Proper value objects
- Event-driven architecture

## Environment Variables

```env
DATABASE_URL=postgresql://...
KV_REST_API_URL=https://...
JWT_SECRET=...
RESEND_API_KEY=...
```

## Quick Start

```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Start development
npm run dev:backend

# Run tests
npm test
```

## Future Enhancements

- [ ] Add GraphQL interface layer
- [ ] Implement event sourcing
- [ ] Add distributed tracing
- [ ] Implement saga pattern for complex workflows
- [ ] Add message queue integration