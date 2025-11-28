# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

**cube-probe** is a full-stack Node.js application that combines a personal SSO (Single Sign-On) authentication platform with **API endpoint monitoring/probing capabilities**. It uses a monorepo architecture with pnpm workspaces.

### Core Features

1. **Authentication System**: JWT-based auth with WebAuthn (passkey) support
2. **API Probe Monitoring**: Schedule periodic HTTP probes to monitor endpoint health
3. **User Management**: Registration, roles (USER/ADMIN), banning/deletion
4. **Application Management**: Third-party app integration with access tokens
5. **File Attachments**: Upload/download with 512MB limit

## Tech Stack

### Backend (`packages/backend/`)

- **Framework**: Fastify 5.x with TypeBox validation
- **Database**: SQLite with Prisma ORM (schema at `prisma/schema.prisma`)
- **Authentication**: @fastify/jwt + @simplewebauthn/server
- **HTTP Client**: Axios (for probe requests)
- **Task Scheduling**: Node.js setInterval-based (IntervalProbeService)
- **API Docs**: Swagger (@fastify/swagger)

### Frontend (`packages/frontend/`)

- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Ant Design V5
- **State Management**: Jotai
- **Data Fetching**: TanStack React Query
- **Routing**: React Router DOM v7
- **Charts**: ECharts

## Common Commands

```bash
# Install dependencies
pnpm install

# Initialize dev database (SQLite + migrations)
pnpm init:dev

# Start backend (default port from ENV_BACKEND_PORT)
pnpm start:backend

# Start frontend (port 3500)
pnpm start:frontend

# Linting
pnpm lint

# Open Prisma Studio
pnpm --filter backend start:db

# Build for production
pnpm --filter backend build
pnpm --filter frontend build
```

## Architecture

### Monorepo Structure

```
packages/
├── backend/    # Fastify API server
└── frontend/   # React admin dashboard
```

### Backend Architecture

**Entry Flow:**
`src/index.ts` → `src/app/build-app.ts` → `src/app/register-service.ts`

**Manual Dependency Injection Pattern:**
Services are instantiated first in `register-service.ts`, then passed to controllers.

**Key Modules (in `src/modules/`):**

- `user/` - User CRUD and authentication
- `auth/` - Login/logout, JWT token handling
- `webauthn/` - FIDO2 passkey credentials
- `attachment/` - File upload/download
- `application/` - Third-party app management
- `monitored-endpoint/` - Endpoint configuration (Service + EndPoint models)
- `monitored-result/` - Probe result storage
- `probe-task/` - **IntervalProbeService** - interval-based probe scheduler
- `probe-result-cleanup/` - Automated cleanup of old probe results
- `app-config/` - Application configuration storage
- `code-executor/` - Code execution sandbox

**API Routes:** All prefixed with `/api`

### Database Models (Prisma)

**Authentication Models:**

- `User` - Core user with roles, banning, password hash
- `WebAuthnCredential` - FIDO2 credentials linked to users
- `Application` - Third-party apps with token keys

**Probe Monitoring Models:**

- `Service` - Service definition (name, base URL, default headers, intervalTime)
- `EndPoint` - Endpoint config (URL, method, headers, intervalTime, timeout, bodyContent)
- `ProbeResult` - Probe execution results (status, responseTime, success, message)

**Other Models:**

- `Attachment` - File metadata
- `AppConfig` - Key-value configuration

### Probe System Design

The probe system uses **interval-based scheduling** (not cron):

1. **Service**: Groups related endpoints with shared defaults (base URL, headers, interval)
2. **EndPoint**: Individual probe targets inheriting from Service
3. **IntervalProbeService**: Manages scheduled probes using `setInterval`
4. **ProbeResultCleanupService**: Periodic cleanup of old results

**URL Resolution:**

- If `EndPoint.url` is absolute (starts with http/https), use directly
- If `EndPoint.url` is relative, concatenate with `Service.url`
- If `EndPoint.url` is empty, use `Service.url`

### Frontend Architecture

**Page Structure (`src/pages/`):**

- `probe-services/` - Service management
- `probe-endpoints/` - Endpoint management
- `probe-result/` - View probe results
- `probe-dashboard/` - Monitoring overview
- `monitored-host/` - Host monitoring
- `host-detail/` - Host details
- `setting-user/` - User management (admin)
- `setting-application/` - App management
- `user-profile/` - Personal profile
- `login/`, `logout/` - Authentication pages

**Layout Components (`src/layouts/`):**

- `app-container/` - Main app shell
- `login-auth.tsx` - Auth guard
- `sidebar/` - Navigation menu
- `header/` - Top bar

## Configuration

### Environment Variables

Backend (`.env` or `.env.local` in `packages/backend/`):

- `BACKEND_JWT_SECRET` - JWT signing secret
- `ENV_BACKEND_PORT` - Server port (default varies)
- `FRONTEND_BASE_URL` - Base URL path for frontend deployment

### Database

- Location: `packages/backend/storage/dev.db` (SQLite)
- Migrations: `packages/backend/prisma/migrations/`

## Development Notes

1. **pnpm workspaces** - Always run from root or use `--filter` syntax
2. **Manual DI** - Services created in `register-service.ts`, passed to controllers
3. **Probe scheduler** starts automatically after controllers register (via `setImmediate`)
4. **Frontend port**: 3500, Backend port: configurable
5. **All API routes** under `/api` prefix
6. **File uploads** limited to 512MB

## Docker Deployment

```bash
# Build
docker build -t cube-probe .

# Run
docker run -d \
  --restart=always \
  -p 9736:3499 \
  -v cube-probe-storage:/app/packages/backend/storage \
  -e FRONTEND_BASE_URL=/cube-probe/ \
  -e BACKEND_JWT_SECRET=your-secret-here \
  cube-probe:latest
```

## Testing

```bash
# Run tests
pnpm --filter backend test

# Run tests with UI
pnpm --filter backend test:ui

# Run tests with coverage
pnpm --filter backend test:coverage
```

Test files are located alongside modules in `__tests__/` directories.
