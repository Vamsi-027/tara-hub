# Testing Steering Document

## Overview

Tara Hub implements a comprehensive testing strategy covering unit tests, integration tests, and end-to-end testing. The testing framework emphasizes component testing, API validation, authentication flows, and user experience verification.

## Current Implementation

### Testing Framework Setup

**Primary Testing Stack**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.8",
    "cypress": "^13.6.0",
    "msw": "^2.0.0"
  }
}
```

**Jest Configuration** (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

**Test Setup** (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Mock NextAuth.js
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())
```

## Testing Strategy

### Component Testing

**Authentication Components**
```typescript
// __tests__/components/admin-dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { AdminDashboard } from '@/components/admin-dashboard'

jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('AdminDashboard', () => {
  it('renders loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    })

    render(<AdminDashboard />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows login when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(<AdminDashboard />)
    expect(screen.getByText('Admin Login')).toBeInTheDocument()
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('shows access denied for non-admin users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'user@example.com', role: 'user' }
      },
      status: 'authenticated'
    })

    render(<AdminDashboard />)
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('renders dashboard for admin users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'varaku@gmail.com', role: 'admin' }
      },
      status: 'authenticated'
    })

    render(<AdminDashboard />)
    expect(screen.getByText('Social Media Dashboard')).toBeInTheDocument()
  })
})
```

**Dashboard Components**
```typescript
// __tests__/components/dashboard-view.test.tsx
import { render, screen } from '@testing-library/react'
import { DashboardView } from '@/components/dashboard-view'

describe('DashboardView', () => {
  it('renders key metrics cards', () => {
    render(<DashboardView />)
    
    expect(screen.getByText('Total Posts')).toBeInTheDocument()
    expect(screen.getByText('Total Engagement')).toBeInTheDocument()
    expect(screen.getByText('Followers')).toBeInTheDocument()
    expect(screen.getByText('Reach')).toBeInTheDocument()
  })

  it('displays chart components', () => {
    render(<DashboardView />)
    
    expect(screen.getByText('Weekly Engagement')).toBeInTheDocument()
    expect(screen.getByText('Platform Distribution')).toBeInTheDocument()
  })

  it('shows recent posts section', () => {
    render(<DashboardView />)
    
    expect(screen.getByText('Recent Posts')).toBeInTheDocument()
    expect(screen.getByText('New Linen Collection Launch')).toBeInTheDocument()
    expect(screen.getByText('Behind the Scenes: Fabric Sourcing')).toBeInTheDocument()
  })

  it('renders engagement metrics correctly', () => {
    render(<DashboardView />)
    
    // Check for metric values
    expect(screen.getByText('127')).toBeInTheDocument() // Total posts
    expect(screen.getByText('2,847')).toBeInTheDocument() // Total engagement
    expect(screen.getByText('1,234')).toBeInTheDocument() // Followers
    expect(screen.getByText('12,847')).toBeInTheDocument() // Reach
  })
})
```

**UI Component Testing**
```typescript
// __tests__/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API Testing

**Authentication API Tests**
```typescript
// __tests__/api/auth.test.ts
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/auth/[...nextauth]/route'

describe('/api/auth/[...nextauth]', () => {
  it('handles GET requests to signin endpoint', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/auth/signin',
    })

    const response = await GET(req as NextRequest)
    expect(response.status).toBe(200)
  })

  it('handles POST requests to signin', async () => {
    const { req } = createMocks({
      method: 'POST',
      url: '/api/auth/signin',
      body: {
        email: 'test@example.com',
        callbackUrl: '/'
      }
    })

    const response = await POST(req as NextRequest)
    expect(response.status).toBe(302) // Redirect after signin
  })
})
```

**Database Integration Tests**
```typescript
// __tests__/lib/db.test.ts
import { db } from '@/lib/db'
import { users } from '@/lib/auth-schema'

// Mock database for testing
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}))

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates user successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }

    ;(db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockUser])
      })
    })

    // Test user creation logic
    expect(db.insert).toHaveBeenCalledWith(users)
  })

  it('handles database connection gracefully', () => {
    // Test graceful handling when DATABASE_URL is not set
    delete process.env.DATABASE_URL
    
    const { db } = require('@/lib/db')
    expect(db).toBe(null)
  })
})
```

### Mock Services

**API Mocking with MSW**
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth endpoints
  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      }
    })
  }),

  // Dashboard API
  http.get('/api/analytics/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalPosts: 127,
        engagement: 2847,
        followers: 1234,
        reach: 12847
      }
    })
  }),

  // Posts API
  http.get('/api/posts', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          platform: 'instagram',
          status: 'published'
        }
      ]
    })
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      data: {
        id: '2',
        ...body,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 })
  })
]
```

**Server Setup**
```typescript
// mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Integration Testing

**Authentication Flow Testing**
```typescript
// __tests__/integration/auth-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { AdminPage } from '@/app/admin/page'

const MockSessionProvider = ({ children, session }: any) => (
  <SessionProvider session={session}>
    {children}
  </SessionProvider>
)

describe('Authentication Integration', () => {
  it('completes full authentication flow', async () => {
    // Start with unauthenticated state
    render(
      <MockSessionProvider session={null}>
        <AdminPage />
      </MockSessionProvider>
    )

    // Should show login form
    expect(screen.getByText('Admin Login')).toBeInTheDocument()
    
    // Click sign in button
    fireEvent.click(screen.getByText('Sign in with Google'))
    
    // Mock successful authentication
    render(
      <MockSessionProvider session={{
        user: { email: 'varaku@gmail.com', role: 'admin' }
      }}>
        <AdminPage />
      </MockSessionProvider>
    )

    // Should now show dashboard
    await waitFor(() => {
      expect(screen.getByText('Social Media Dashboard')).toBeInTheDocument()
    })
  })

  it('handles authorization correctly', () => {
    // Test with non-admin user
    render(
      <MockSessionProvider session={{
        user: { email: 'user@example.com', role: 'user' }
      }}>
        <AdminPage />
      </MockSessionProvider>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })
})
```

**Dashboard Data Flow Testing**
```typescript
// __tests__/integration/dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardView } from '@/components/dashboard-view'

describe('Dashboard Integration', () => {
  it('loads and displays analytics data', async () => {
    render(<DashboardView />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('127')).toBeInTheDocument() // Total posts
    })

    // Check all metrics are displayed
    expect(screen.getByText('2,847')).toBeInTheDocument() // Engagement
    expect(screen.getByText('1,234')).toBeInTheDocument() // Followers
    expect(screen.getByText('12,847')).toBeInTheDocument() // Reach
  })

  it('handles loading states properly', () => {
    render(<DashboardView />)
    
    // Should show loading indicators while data fetches
    // (Implementation depends on loading state management)
  })
})
```

### End-to-End Testing

**Cypress Configuration** (`cypress.config.js`)
```javascript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-secret'
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
```

**E2E Test Examples**
```typescript
// cypress/e2e/admin-workflow.cy.ts
describe('Admin Dashboard Workflow', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          email: 'varaku@gmail.com',
          role: 'admin'
        }
      }
    })
  })

  it('should navigate through admin dashboard', () => {
    cy.visit('/admin')
    
    // Should show dashboard
    cy.contains('Social Media Dashboard').should('be.visible')
    
    // Check metrics cards
    cy.contains('Total Posts').should('be.visible')
    cy.contains('Total Engagement').should('be.visible')
    
    // Interact with sidebar
    cy.get('[data-testid="sidebar-trigger"]').click()
    
    // Navigate to different sections
    cy.contains('Analytics').click()
    cy.url().should('include', '/analytics')
  })

  it('should handle post creation workflow', () => {
    cy.visit('/admin')
    
    // Navigate to post creation
    cy.contains('Create Post').click()
    
    // Fill out form
    cy.get('[data-testid="post-title"]').type('New Test Post')
    cy.get('[data-testid="post-content"]').type('Test post content')
    cy.get('[data-testid="platform-select"]').select('Instagram')
    
    // Submit form
    cy.get('[data-testid="submit-post"]').click()
    
    // Verify success
    cy.contains('Post created successfully').should('be.visible')
  })
})

describe('Authentication Flow', () => {
  it('should handle unauthorized access', () => {
    cy.visit('/admin')
    
    // Should redirect to login
    cy.contains('Admin Login').should('be.visible')
    cy.contains('Sign in with Google').should('be.visible')
  })

  it('should handle role-based access', () => {
    // Mock regular user session
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          email: 'user@example.com',
          role: 'user'
        }
      }
    })

    cy.visit('/admin')
    
    // Should show access denied
    cy.contains('Access Denied').should('be.visible')
  })
})
```

## Test Organization

### Directory Structure

```
__tests__/
├── components/
│   ├── ui/
│   │   ├── button.test.tsx
│   │   ├── card.test.tsx
│   │   └── sidebar.test.tsx
│   ├── admin-dashboard.test.tsx
│   ├── dashboard-view.test.tsx
│   └── providers.test.tsx
├── lib/
│   ├── auth.test.ts
│   ├── db.test.ts
│   ├── types.test.ts
│   └── utils.test.ts
├── api/
│   ├── auth.test.ts
│   ├── posts.test.ts
│   └── analytics.test.ts
├── integration/
│   ├── auth-flow.test.tsx
│   ├── dashboard.test.tsx
│   └── post-management.test.tsx
└── fixtures/
    ├── users.ts
    ├── posts.ts
    └── analytics.ts

cypress/
├── e2e/
│   ├── admin-workflow.cy.ts
│   ├── auth-flow.cy.ts
│   └── public-pages.cy.ts
├── fixtures/
│   ├── users.json
│   └── posts.json
└── support/
    ├── commands.ts
    └── e2e.ts

mocks/
├── handlers.ts
├── server.ts
└── browser.ts
```

### Test Data Management

**Test Fixtures**
```typescript
// __tests__/fixtures/users.ts
export const mockUsers = {
  admin: {
    id: '1',
    email: 'varaku@gmail.com',
    name: 'Admin User',
    role: 'admin'
  },
  user: {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user'
  }
}

// __tests__/fixtures/posts.ts
export const mockPosts = [
  {
    id: '1',
    title: 'New Linen Collection Launch',
    content: 'Exciting new fabrics available...',
    platform: 'instagram',
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Behind the Scenes',
    content: 'See how we source our fabrics...',
    platform: 'facebook',
    status: 'draft',
    createdAt: '2024-01-16T10:00:00Z'
  }
]
```

**Test Utilities**
```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'

interface CustomRenderOptions extends RenderOptions {
  session?: any
  theme?: string
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    session = null,
    theme = 'light',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme={theme}>
          {children}
        </ThemeProvider>
      </SessionProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { renderWithProviders as render }
```

## Testing Guidelines

### Test Writing Standards

1. **Test Naming Convention**
   - Descriptive test names that explain the expected behavior
   - Use "should" statements for clarity
   - Group related tests in describe blocks

2. **Test Structure**
   - Follow Arrange-Act-Assert pattern
   - Clear setup and teardown procedures
   - Minimal test data requirements

3. **Mocking Strategy**
   - Mock external dependencies (APIs, databases)
   - Use MSW for API mocking
   - Mock authentication providers

4. **Assertion Guidelines**
   - Test behavior, not implementation
   - Use semantic queries from Testing Library
   - Assert on user-visible changes

### Performance Testing

**Load Testing with Artillery**
```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer test-token'

scenarios:
  - name: 'Dashboard Load Test'
    flow:
      - get:
          url: '/api/analytics/dashboard'
      - think: 1
      - get:
          url: '/api/posts'
```

### Continuous Integration

**GitHub Actions Test Workflow**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:ci
    
    - name: Run E2E tests
      run: npm run cypress:headless
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

This comprehensive testing strategy ensures high code quality, reliable functionality, and excellent user experience across the Tara Hub application.