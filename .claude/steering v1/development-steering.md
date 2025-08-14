# Development Guidelines - tara-hub

## Code Standards

### TypeScript Conventions
```typescript
// ✅ Good: Explicit types, clear naming
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  updatedAt: Date;
}

// ❌ Bad: Any types, unclear names
interface Item {
  id: any;
  n: string;
  q: number;
  u: any;
}
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `InventoryList.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase with `.types.ts` extension

### Directory Structure
```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth group routes
│   ├── (dashboard)/       # Dashboard group routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   └── layouts/           # Layout components
├── lib/                   # Utilities and helpers
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## Component Guidelines

### Server vs Client Components
```typescript
// Server Component (default)
// app/inventory/page.tsx
export default async function InventoryPage() {
  const items = await getInventory(); // Direct DB call
  return <InventoryList items={items} />;
}

// Client Component (interactive)
// components/InventoryForm.tsx
'use client';
import { useState } from 'react';

export function InventoryForm() {
  const [data, setData] = useState();
  // Interactive logic here
}
```

### Component Structure
```typescript
// Standard component template
import { FC } from 'react';

interface ComponentNameProps {
  // Props definition
}

export const ComponentName: FC<ComponentNameProps> = ({
  prop1,
  prop2
}) => {
  // Hooks first
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

## Git Workflow

### Branch Strategy
```
main
├── develop
│   ├── feature/INV-123-add-barcode
│   ├── feature/INV-124-bulk-import
│   └── bugfix/INV-125-fix-auth
└── release/v1.2.0
```

### Commit Conventions
```bash
# Format: <type>(<scope>): <subject>

feat(inventory): add barcode scanning support
fix(auth): resolve session timeout issue
docs(api): update endpoint documentation
refactor(components): optimize inventory list rendering
test(api): add inventory endpoint tests
style(ui): update dashboard layout
chore(deps): update dependencies
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Testing Approach

### Unit Testing
```typescript
// __tests__/components/InventoryItem.test.tsx
import { render, screen } from '@testing-library/react';
import { InventoryItem } from '@/components/InventoryItem';

describe('InventoryItem', () => {
  it('should render item details', () => {
    render(<InventoryItem item={mockItem} />);
    expect(screen.getByText('Item Name')).toBeInTheDocument();
  });
});
```

### API Testing
```typescript
// __tests__/api/inventory.test.ts
import { GET, POST } from '@/app/api/inventory/route';

describe('/api/inventory', () => {
  it('should return inventory items', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### Testing Standards
- **Coverage Target**: 80% minimum
- **Test Categories**: Unit, Integration, E2E
- **Mock Data**: Centralized in `__mocks__`
- **Test Utilities**: Custom render wrapper

## API Development

### Endpoint Structure
```typescript
// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Validate auth
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Process request
    const data = await fetchInventory();
    
    // Return response
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Error Handling
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// Usage
throw new AppError(400, 'Invalid inventory data');
```

## Database Operations

### Query Patterns
```typescript
// lib/db/inventory.ts
export async function getInventory(filters?: InventoryFilters) {
  const key = filters ? 
    `inventory:filtered:${JSON.stringify(filters)}` : 
    'inventory:all';
    
  // Check cache
  const cached = await kv.get(key);
  if (cached) return cached;
  
  // Fetch from DB
  const items = await kv.smembers('inventory:ids');
  const inventory = await Promise.all(
    items.map(id => kv.hgetall(`inventory:${id}`))
  );
  
  // Cache result
  await kv.setex(key, 300, inventory); // 5 min cache
  
  return inventory;
}
```

### Data Validation
```typescript
// lib/validations/inventory.ts
import { z } from 'zod';

export const inventorySchema = z.object({
  name: z.string().min(1).max(100),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  quantity: z.number().int().min(0),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
  reorderPoint: z.number().int().min(0)
});

// Usage
const validated = inventorySchema.parse(requestData);
```

## Performance Best Practices

### Optimization Checklist
- [ ] Use Server Components by default
- [ ] Implement proper caching strategies
- [ ] Optimize images with Next.js Image
- [ ] Code split with dynamic imports
- [ ] Minimize client-side JavaScript
- [ ] Use proper loading states
- [ ] Implement error boundaries

### Code Splitting
```typescript
// Dynamic import for heavy components
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <Skeleton />,
    ssr: false
  }
);
```

## Security Guidelines

### Input Sanitization
```typescript
// Always validate and sanitize inputs
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### Authentication Checks
```typescript
// Protect API routes
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check role
  if (session.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Process request
}
```

## Documentation Standards

### Code Documentation
```typescript
/**
 * Calculate inventory value
 * @param items - Array of inventory items
 * @param includeDeprecated - Include deprecated items
 * @returns Total inventory value in cents
 */
export function calculateInventoryValue(
  items: InventoryItem[],
  includeDeprecated = false
): number {
  // Implementation
}
```

### README Structure
```markdown
# Feature Name

## Overview
Brief description

## Installation
Step-by-step guide

## Usage
Code examples

## API Reference
Endpoint documentation

## Contributing
Guidelines for contributors
```

## Code Review Checklist

### Before Submitting PR
- [ ] Code compiles without warnings
- [ ] All tests pass
- [ ] No console.log statements
- [ ] TypeScript types are explicit
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] Performance impact considered
- [ ] Security implications reviewed

### Review Focus Areas
1. **Logic**: Is the logic correct and efficient?
2. **Style**: Does it follow our conventions?
3. **Testing**: Are tests comprehensive?
4. **Security**: Any security concerns?
5. **Performance**: Any performance impacts?
6. **Documentation**: Is it well documented?
