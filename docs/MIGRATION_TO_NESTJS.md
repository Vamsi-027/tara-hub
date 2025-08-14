# Migration Path to NestJS Backend

## Current Architecture vs. Future NestJS Architecture

### Current: Next.js Full-Stack
```
Client → Next.js API Routes → Database
         ↓
    NextAuth.js (embedded)
```

### Future: Decoupled with NestJS
```
Client (Next.js) → NestJS API → Database
                    ↓
                Passport.js / Custom JWT
```

## Preparation Strategy for Future Migration

### 1. Decouple Authentication Logic

Create an abstraction layer that can work with both Next.js and NestJS:

```typescript
// lib/auth/auth-service.ts - Works with any backend
export interface AuthService {
  signIn(email: string): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  verifyToken(token: string): Promise<User | null>;
}

// lib/auth/nextauth-service.ts - Current implementation
export class NextAuthService implements AuthService {
  // Current NextAuth implementation
}

// lib/auth/nestjs-service.ts - Future implementation
export class NestJSAuthService implements AuthService {
  // Future NestJS/JWT implementation
}
```

### 2. API Client Pattern

Create a unified API client that can switch between Next.js API routes and NestJS:

```typescript
// lib/api/client.ts
export class APIClient {
  private baseURL: string;

  constructor() {
    // Switch between Next.js API and NestJS backend
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  private async getToken() {
    // Get JWT from NextAuth or NestJS
    if (process.env.NEXT_PUBLIC_USE_NESTJS) {
      return localStorage.getItem('jwt_token');
    } else {
      const session = await getSession();
      return session?.accessToken;
    }
  }
}
```

### 3. Shared Types and Interfaces

Keep types in a shared location that both Next.js and NestJS can use:

```typescript
// packages/shared/types/auth.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

## NestJS Backend Structure (Future)

### Authentication Module
```typescript
// nestjs-backend/src/auth/auth.module.ts
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
```

### JWT Strategy
```typescript
// nestjs-backend/src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { email } = payload;
    const user = await this.userRepository.findOne({ email });
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    return user;
  }
}
```

### Auth Controller
```typescript
// nestjs-backend/src/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  @Post('signin/email')
  async signInWithEmail(@Body() dto: EmailSignInDto) {
    const user = await this.authService.validateUser(dto.email);
    if (!user) {
      throw new UnauthorizedException('Access denied');
    }
    
    // Send magic link
    await this.emailService.sendMagicLink(dto.email);
    return { message: 'Check your email' };
  }

  @Post('verify')
  async verifyMagicLink(@Body() dto: VerifyTokenDto) {
    const user = await this.authService.verifyMagicLink(dto.token);
    const tokens = await this.authService.generateTokens(user);
    return tokens;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@GetUser() user: User) {
    return this.authService.generateTokens(user);
  }
}
```

## Migration Steps

### Phase 1: Prepare Current System (Do Now)
1. ✅ Create abstraction layers
2. ✅ Use environment variables for API URLs
3. ✅ Separate business logic from Next.js specific code
4. ✅ Create shared types package

### Phase 2: Build NestJS Backend (When Ready)
1. Set up NestJS project with authentication
2. Implement JWT-based auth with same email provider
3. Migrate database schema
4. Create compatible API endpoints

### Phase 3: Gradual Migration
1. Deploy NestJS backend
2. Update environment variable to point to NestJS
3. Test with subset of users
4. Full migration once stable

## Code Changes for Migration Readiness

### 1. Update API Calls
```typescript
// Instead of this (tightly coupled):
const response = await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify(data),
});

// Use this (decoupled):
import { apiClient } from '@/lib/api/client';
const response = await apiClient.post('/posts', data);
```

### 2. Abstract Session Management
```typescript
// lib/auth/session-manager.ts
export class SessionManager {
  async getSession() {
    if (process.env.NEXT_PUBLIC_USE_NESTJS) {
      // Get JWT from localStorage/cookie
      return this.getJWTSession();
    } else {
      // Use NextAuth
      return getServerSession(authOptions);
    }
  }

  private async getJWTSession() {
    const token = this.getStoredToken();
    if (!token) return null;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded as Session;
    } catch {
      return null;
    }
  }
}
```

### 3. Environment-Based Configuration
```env
# .env.local for Next.js only
NEXT_PUBLIC_AUTH_PROVIDER=nextauth
NEXT_PUBLIC_API_URL=

# .env.local for NestJS backend
NEXT_PUBLIC_AUTH_PROVIDER=nestjs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Benefits of This Approach

1. **Gradual Migration**: No big bang deployment
2. **Backward Compatible**: Can roll back easily
3. **Testing**: Can A/B test both systems
4. **Microservices Ready**: Easy to split into services
5. **Technology Agnostic**: Can switch to any backend

## Database Compatibility

Both systems can use the same database schema:

```sql
-- Works with both NextAuth and NestJS/TypeORM
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Recommended Architecture Pattern

```
/apps
  /web (Next.js frontend)
    /lib
      /api (API client abstraction)
      /auth (Auth abstraction)
  /api (NestJS backend - future)
    /src
      /auth
      /users
      /posts

/packages
  /shared (Shared types and utilities)
    /types
    /utils
    /constants
```

## Tools for Migration

1. **Turborepo**: Monorepo management
2. **Docker**: Containerize both services
3. **nginx**: Route traffic between services
4. **Feature Flags**: Toggle between implementations
5. **JWT Libraries**: jsonwebtoken for both platforms

## Timeline Estimation

- **Phase 1 (Current)**: 1-2 weeks - Make current system migration-ready
- **Phase 2 (NestJS Build)**: 2-3 weeks - Build NestJS backend
- **Phase 3 (Migration)**: 1-2 weeks - Gradual migration
- **Total**: 4-7 weeks for complete migration

## Conclusion

By following this architecture pattern, you can:
1. Use Next.js with NextAuth now
2. Migrate to NestJS when needed
3. Keep the same database and business logic
4. Minimize code rewriting
5. Maintain system stability during transition