# Migration Examples: Current vs Future Code

## Example 1: API Calls

### Current (Tightly Coupled to Next.js)
```typescript
// components/posts/PostForm.tsx
const handleSubmit = async (data: PostData) => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
};
```

### Migration-Ready (Works with Both)
```typescript
// components/posts/PostForm.tsx
import { apiClient } from '@/lib/api/client';

const handleSubmit = async (data: PostData) => {
  const response = await apiClient.post('/posts', data);
  if (response.success) {
    // Handle success
  }
};
```

### With Custom Hook (Even Better)
```typescript
// components/posts/PostForm.tsx
import { useAPI } from '@/hooks/use-api';

function PostForm() {
  const { post, loading, error } = useAPI<Post>();
  
  const handleSubmit = async (data: PostData) => {
    const response = await post('/posts', data);
    if (response.success) {
      // Handle success
    }
  };
}
```

## Example 2: Authentication

### Current (NextAuth Specific)
```typescript
// pages/admin/dashboard.tsx
import { useSession } from 'next-auth/react';
import { signIn, signOut } from 'next-auth/react';

function Dashboard() {
  const { data: session } = useSession();
  
  if (!session) {
    return <button onClick={() => signIn()}>Sign In</button>;
  }
  
  return (
    <div>
      Welcome {session.user.email}
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Migration-Ready (Abstracted)
```typescript
// pages/admin/dashboard.tsx
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <button onClick={() => authService.signIn({ provider: 'email' })}>
        Sign In
      </button>
    );
  }
  
  return (
    <div>
      Welcome {user.email}
      <button onClick={() => authService.signOut()}>Sign Out</button>
    </div>
  );
}
```

## Example 3: Protected API Routes

### Current (Next.js API Route)
```typescript
// pages/api/admin/users.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Handle request
}
```

### Future (NestJS Controller)
```typescript
// nestjs-backend/src/admin/users.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get()
  @Roles('admin')
  async getUsers() {
    // Handle request
  }
}
```

## Example 4: Data Fetching

### Current (Direct Fetch)
```typescript
// hooks/use-posts.ts
import { useEffect, useState } from 'react';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);
  
  return posts;
}
```

### Migration-Ready (Using Abstractions)
```typescript
// hooks/use-posts.ts
import { useEffect } from 'react';
import { useAPI } from '@/hooks/use-api';

export function usePosts() {
  const { data: posts, get, loading, error } = useAPI<Post[]>();
  
  useEffect(() => {
    get('/posts');
  }, []);
  
  return { posts, loading, error };
}
```

## Example 5: Form Submission

### Current
```typescript
// components/BlogForm.tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  const response = await fetch('/api/blog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  if (response.ok) {
    router.push('/blog');
  }
};
```

### Migration-Ready
```typescript
// components/BlogForm.tsx
import { apiClient } from '@/lib/api/client';

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  const response = await apiClient.post('/blog', formData);
  
  if (response.success) {
    router.push('/blog');
  } else {
    setError(response.error);
  }
};
```

## Configuration for Migration

### Environment Variables

```env
# .env.local for Next.js only mode
NEXT_PUBLIC_AUTH_PROVIDER=nextauth
# NEXT_PUBLIC_API_URL not set - uses internal /api routes

# .env.local for NestJS backend mode
NEXT_PUBLIC_AUTH_PROVIDER=nestjs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Switching Between Modes

Simply change the environment variables and restart:

```bash
# Development with Next.js API routes
npm run dev

# Development with NestJS backend
NEXT_PUBLIC_AUTH_PROVIDER=nestjs NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

## Benefits of This Approach

1. **Zero Code Changes**: Switch backends by changing environment variables
2. **Gradual Migration**: Migrate one feature at a time
3. **Testing**: Run both systems in parallel for A/B testing
4. **Rollback**: Easy to revert if issues arise
5. **Type Safety**: Shared types ensure consistency

## Checklist for Migration-Ready Code

- [ ] Use `apiClient` instead of direct `fetch` calls
- [ ] Use `authService` instead of NextAuth directly
- [ ] Use abstracted hooks (`useAuth`, `useAPI`)
- [ ] Keep business logic separate from framework code
- [ ] Use environment variables for configuration
- [ ] Share types between frontend and backend
- [ ] Document API contracts clearly