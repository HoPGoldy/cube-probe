# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cube-card is a full-stack Node.js authentication platform built with a monorepo architecture using pnpm workspaces. It combines traditional JWT authentication with WebAuthn (passkey) authentication for enhanced security.

## Common Commands

### Development Setup
```bash
# Install all dependencies
pnpm install

# Initialize development database (creates SQLite DB and runs migrations)
pnpm init:dev

# Start backend development server (port from ENV_BACKEND_PORT, default 3000)
pnpm start:backend

# Start frontend development server (port 3500)
pnpm start:frontend

# Run linting across all packages
pnpm lint
```

### Package-specific Commands
```bash
# Backend (packages/backend/)
pnpm --filter backend start:dev    # Development server with tsx watch
pnpm --filter backend start:db     # Open Prisma Studio
pnpm --filter backend build        # Build for production with pkgroll
pnpm --filter backend init:dev     # Run Prisma migrations

# Frontend (packages/frontend/)
pnpm --filter frontend start:dev   # Vite dev server on port 3500
pnpm --filter frontend build       # TypeScript compile + Vite build

# Demo App (packages/app-demo-frontend/)
pnpm --filter app-demo-frontend dev # Vite dev server on port 3501
```

### Docker Deployment
```bash
# Build image
docker build -t cube-card .

# Run container
docker run -d -p 3001:3000 -e JWT_SECRET=xxxxxx cube-card
```

## Architecture Overview

### Monorepo Structure
- **packages/backend/**: NestJS API server with Fastify
- **packages/frontend/**: React admin dashboard (Ant Design V5)
- **packages/app-demo-frontend/**: Demo React app for API integration

### Backend Architecture (NestJS + Fastify)

**Core Application Flow:**
1. `src/index.ts` → `src/app/build-app.ts` → `src/app/build-service.ts`
2. Manual dependency injection pattern: Services created first, then passed to controllers
3. All API routes prefixed with `/api`

**Key Modules:**
- **User Management**: Registration, login, user roles (USER/ADMIN), banning/deletion
- **Authentication**: JWT tokens + WebAuthn passkey support
- **Attachment**: File upload/download (512MB limit, multipart handling)
- **Application**: Third-party app management with access tokens
- **WebAuthn**: FIDO2 credential management (newest feature)

**Database:**
- SQLite with Prisma ORM
- Schema: `packages/backend/prisma/schema.prisma`
- Storage location: `packages/backend/storage/dev.db`

**Key Libraries:**
- Fastify with TypeBox validation
- @simplewebauthn/server for WebAuthn
- JWT authentication via @fastify/jwt
- Swagger for API docs

### Frontend Architecture (React + Vite)

**Technology Stack:**
- React 18.3.1 + TypeScript + Vite
- Ant Design V5 for UI components
- Jotai for state management
- TanStack React Query for API calls
- React Router DOM v7 for routing

**Key Patterns:**
- Page-based routing in `src/pages/`
- Layout components in `src/layouts/`
- Shared components in `src/components/`
- Services for API integration

## Configuration Requirements

### Backend Environment Setup
1. Copy `packages/backend/.env.example` to `packages/backend/.env`
2. Required variables: `JWT_SECRET`
3. Optional: `ENV_BACKEND_PORT` (default from environment)

### Database Schema Key Models
- **User**: Core authentication with roles (USER/ADMIN), banning support
- **WebAuthnCredential**: FIDO2 credentials linked to users
- **Attachment**: File metadata with user association
- **Application**: Third-party applications with token keys

## Development Notes

- The project uses **pnpm workspaces** - always run commands from root or use `--filter` syntax
- Backend uses **manual dependency injection** - see `src/app/build-service.ts` for the pattern
- WebAuthn implementation is recent - focus on error handling in `modules/webauthn/error.ts`
- SQLite database is file-based at `packages/backend/storage/dev.db`
- Frontend runs on port 3500, backend port configurable (usually 3000)
- All API routes under `/api` prefix
- File uploads limited to 512MB