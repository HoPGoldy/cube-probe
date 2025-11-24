# Project Context for Qwen Code

## Project Overview

This is a full-stack web application named "cube-card". It is built using a monorepo structure managed by pnpm workspaces.

- **Frontend**: A React application using Vite as the build tool, written in TypeScript. It utilizes Ant Design (antdV5) for the UI components, Jotai for state management, and Axios for network requests.
- **Backend**: A NestJS application written in TypeScript. It uses Prisma as the ORM with SQLite as the database. Authentication is handled by Passport and JWT. Swagger is integrated for API documentation.

## Key Technologies & Tools

- **Package Manager**: pnpm
- **Monorepo Structure**: `packages/backend`, `packages/frontend`
- **Frontend Framework**: React + Vite + TypeScript
- **Frontend UI Library**: Ant Design (antdV5)
- **Frontend State Management**: Jotai
- **Frontend HTTP Client**: Axios
- **Backend Framework**: NestJS (TypeScript)
- **Backend Database**: Prisma ORM + SQLite
- **Backend Authentication**: Passport + JWT
- **Backend API Docs**: Swagger
- **Containerization**: Docker

## Development Setup & Commands

### Prerequisites

- Node.js (>=18.19.1)
- pnpm

### Initial Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Initialize the development database for the backend:
   ```bash
   pnpm init:dev
   ```
3. Configure backend environment variables:
   - Navigate to `packages/backend`.
   - Copy `.env.example` to `.env`.
   - Fill in the required parameters (e.g., `BACKEND_JWT_SECRET`).

### Running the Application

- Start the backend development server:
  ```bash
  pnpm start:backend
  ```
  (This runs `nest start --watch` in the `packages/backend` directory)
- Start the frontend development server:
  ```bash
  pnpm start:frontend
  ```
  (This runs `vite --host --port 3500` in the `packages/frontend` directory)

### Building the Application

- To build the entire project for production:
  - Use the Docker build process (see below) which handles building both frontend and backend.
- To build individual parts:
  - Build the backend:
    ```bash
    pnpm --filter backend build
    ```
  - Build the frontend:
    ```bash
    pnpm --filter frontend build
    ```

### Testing

- Backend tests:
  - Run all tests: `pnpm --filter backend test`
  - Run tests in watch mode: `pnpm --filter backend test:watch`
  - Run tests with coverage: `pnpm --filter backend test:cov`
  - Run end-to-end tests: `pnpm --filter backend test:e2e`

### Docker

- Build the Docker image:
  ```bash
  docker build -t cube-card .
  ```
- Run the Docker container:
  ```bash
  docker run -d -p 3001:3000 -e JWT_SECRET=xxxxxx cube-card
  ```
  (Ensure `JWT_SECRET` is set appropriately. Other environment variables like `FRONTEND_BASE_URL` can also be passed.)

## Development Conventions

- **Monorepo**: Code is split into `backend` and `frontend` packages within the `packages` directory.
- **Environment Variables**: Backend uses `dotenv` and `.env` files for configuration. An `.env.example` is provided.
- **Database Migrations**: Prisma is used for database schema management and migrations (`prisma migrate dev`, `prisma migrate deploy`).
- **Database Seeding**: Prisma seeding is configured via `prisma/seed.ts` (as indicated in `packages/backend/package.json`).
- **Entrypoint Script**: The Docker image uses an `entrypoint.sh` script to perform tasks like database migrations, seeding, and starting the backend service before the main application starts.
- **Linting**: ESLint is configured at the root for the monorepo.
- **Code Style**: All modified code should adhere to the project's Prettier formatting style.

## Recent Changes

### Moment Detail Page Enhancement
- Converted the Moment detail modal into a dedicated route page (`/moments/:id`)
- Updated routing configuration to include the new detail page route
- Modified the Moment list page to navigate to the detail page on item click instead of opening a modal
- Preserved all existing functionality including delete and edit operations
- Kept the existing modal for editing functionality, maintaining consistency with the add operation

### Attachment Display Enhancement
- Redesigned attachment display in the Moment detail page as rounded square cards
- Added image preview functionality for image files using Ant Design Image component
- Added file type-specific icons for non-image files (PDF, Word, Excel, etc.)
- Implemented a responsive grid layout for attachment cards
- Added hover effects for better user experience
- Backend: Added a new `/api/attachments/view` endpoint that properly displays images inline instead of forcing download

## Qwen Added Memories
- 实现了 cube-card 应用的 WebAuthn 功能，包括后端服务（Prisma 模型、验证服务、控制器）和前端页面（个人资料页、WebAuthn 服务、路由和侧边栏更新）
- 更新了前端实现，使用 @simplewebauthn/browser 来处理 WebAuthn 操作，简化了前端代码
- 在登录页面添加了选项卡功能，用户可以在账号密码登录和 WebAuthn 登录之间切换
