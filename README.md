# Tara Hub - Fabric Marketplace Platform

Production-ready Next.js 15 fabric marketplace with MedusaJS v2 backend.

## ✨ Features

- **Multi-Tenant Architecture**: Support for multiple stores and brands
- **Extensive Fabric Catalog**: 60+ field comprehensive inventory system
- **Clean Architecture Backend**: Domain-Driven Design with SOLID principles
- **Advanced Admin Dashboard**: Bulk operations, CSV/Excel import/export
- **Magic Link Authentication**: Secure passwordless auth system
- **Real-time Inventory**: Stock tracking, alerts, and reorder management
- **Content Management**: Blog, social media, and marketing content

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Clean Architecture, Domain-Driven Design
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Caching**: Vercel KV (Redis) with hybrid strategy
- **Authentication**: Custom JWT-based magic links
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Storage**: Cloudflare R2
- **Email**: Resend API
- **Deployment**: Vercel

## 📦 Quick Start

\`\`\`bash
# Clone repository
git clone https://github.com/varaku1012/tara-hub.git
cd tara-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
\`\`\`

## 📁 Project Structure

```
tara-hub/
├── app/                    # Main admin dashboard (Next.js App Router)
├── experiences/            # Customer-facing applications
│   ├── fabric-store/       # E-commerce browsing (port 3006)
│   └── store-guide/        # Store management (port 3007)
├── backend/                # Clean Architecture Backend
│   ├── domain/             # Business logic & entities
│   ├── application/        # Use cases & orchestration
│   ├── infrastructure/     # External implementations
│   └── interfaces/         # API controllers & routes
├── src/                    # Frontend source code
│   ├── modules/            # Feature modules
│   ├── core/               # Core services
│   └── shared/             # Shared UI components
└── deployment/             # Deployment configurations
```

## 🔧 Environment Variables

See `.env.example` for required environment variables:
- `DATABASE_URL` - PostgreSQL connection
- `KV_REST_API_URL` - Redis/KV store
- `JWT_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service
- `R2_*` - Cloudflare R2 storage

## 🚀 Development

```bash
# Frontend
npm run dev:admin         # Admin dashboard (port 3000)
npm run dev:fabric-store  # Fabric store (port 3006)
npm run dev:store-guide   # Store guide (port 3007)

# Backend
npm run dev:backend       # All backend services
npm run db:studio         # Drizzle Studio GUI
npm run db:seed          # Seed sample data
```

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions
- [Backend Architecture](./backend/README.md) - Clean architecture details
- [Documentation](./docs/) - Additional guides

---

**Status**: ✅ Production Ready | **Architecture**: Clean Architecture + DDD
