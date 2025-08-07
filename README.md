# Tara Hub - Premium Fabric Marketplace

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://tara-hub.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

## 🚀 Overview

Tara Hub is a modern fabric marketplace platform built with Next.js 15, featuring a comprehensive catalog of premium fabrics for designers, manufacturers, and textile enthusiasts.

## ✨ Features

- **Extensive Fabric Catalog**: Browse through premium fabrics with detailed specifications
- **Advanced Filtering**: Search by category, color, composition, and availability
- **Responsive Design**: Optimized for all devices
- **Fast Performance**: Static generation for instant page loads
- **Admin Dashboard**: Manage inventory and content
- **Secure Authentication**: NextAuth.js integration

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: Vercel KV (with fallback)
- **Deployment**: Vercel

## 📦 Quick Start

```bash
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
```

## 🔧 Environment Variables

```env
# Required
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Optional (for admin features)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🚀 Deployment

This project auto-deploys to Vercel on every push to `main` branch.

---

**Status**: ✅ Production Ready | **Last Updated**: December 2024
