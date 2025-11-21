# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guard Inbox is a full-stack promotional email management application that scans Gmail accounts for promotional emails, extracts promo codes and discounts using OpenAI, and presents them in an organized interface. The architecture is a monorepo with separate backend and frontend directories.

**Backend**: AdonisJS v6 (TypeScript) API with PostgreSQL
**Frontend**: React + TypeScript + Vite with React Router and Tailwind CSS

## Development Commands

### Backend (AdonisJS)
```bash
cd backend
npm run dev              # Start dev server with HMR
npm run build            # Build for production
npm start                # Run production build
npm test                 # Run all tests
npm run lint             # Lint with ESLint
npm run format           # Format with Prettier
npm run typecheck        # TypeScript type checking
node ace scan:promos     # Process pending scan jobs
node ace migration:run   # Run database migrations
node ace migration:rollback  # Rollback last batch
node ace list            # List all Ace commands
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production (includes typecheck)
npm run preview          # Preview production build
npm run lint             # Lint with ESLint
```

## Architecture

### Backend Structure

The backend uses AdonisJS v6 with the following key patterns:

**Path Aliases**: Import paths use `#` prefix (e.g., `#models/*`, `#services/*`, `#controllers/*`) defined in package.json `imports` field. Always use these aliases instead of relative paths.

**Dependency Injection**: Services use `@inject()` decorator for automatic DI. The IoC container resolves dependencies automatically.

**Data Flow**:
1. Routes (`start/routes.ts`) → Controllers → Services → Models
2. OAuth flow: User → Gmail OAuth → EmailAccount stored with tokens
3. Scan flow: User triggers scan → ScanJob created → Background command processes job → GmailScanService fetches emails → PromoExtractionService uses OpenAI → PromoCode saved
4. Feed/Vault: Controllers query PromoCode with relations

**Key Services**:
- `GmailOAuthService`: Manages Google OAuth client setup and token refresh
- `GmailScanService`: Fetches emails from Gmail API (last 30 days, category:promotions), saves Email records, delegates extraction
- `PromoExtractionService`: Coordinates with OpenAIService for extraction
- `OpenAIService`: Uses OpenAI API (Chat Completion or Assistant) to extract promo codes, discounts, vendor, expiry from email content

**Models & Relationships**:
- `User` → hasMany `EmailAccount`, `ScanJob`
- `EmailAccount` → hasMany `Email`, stores Google OAuth tokens
- `Email` → hasMany `PromoCode`, stores Gmail message data
- `PromoCode`: The extracted promotional data (code, discount, vendor, expiry)
- `ScanJob`: Tracks background scan status (PENDING/RUNNING/DONE/FAILED)

**Background Processing**: The `scan:promos` command queries pending ScanJobs and processes them sequentially. This is meant to run as a scheduled job or manually triggered.

**Middleware Stack**:
- Server: container bindings, force JSON response, CORS
- Router: body parser, session, auth initialization
- Named: `auth` (requires authenticated user), `guest` (requires unauthenticated)

**Database**: PostgreSQL with Lucid ORM. SSL is configurable via `DB_SSL` env var.

### Frontend Structure

**Routing**: React Router v7 with nested routes
- Public: `/login`, `/register`
- Protected (via `ProtectedRoute`): `/dashboard`, `/promos`, `/vault`
- Layout wrapper with shared navigation

**Authentication**: Session-based auth with `withCredentials: true` for cookies. AuthContext manages user state.

**API Client**: Axios instance (`src/api/client.ts`) configured for `http://localhost:3333/api` with credentials.

**Pages**:
- `Dashboard`: Email account management, connect Gmail, trigger scans
- `Promos`: Feed of recent promotional deals
- `Vault`: All promo codes organized by vendor

**Styling**: Tailwind CSS with custom utilities via `tailwind-merge` and `clsx`.

## Environment Setup

### Backend `.env`
Required variables:
- `APP_KEY`: Generate with `node ace generate:key`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`: PostgreSQL connection
- `DB_SSL`: Set to `true` for production databases with SSL
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials from Google Cloud Console
- `GOOGLE_REDIRECT_URI`: Callback for email account OAuth (e.g., `http://localhost:3333/api/email-accounts/callback`)
- `GOOGLE_LOGIN_REDIRECT_URI`: Callback for user login OAuth
- `SESSION_DRIVER`: Set to `cookie`
- `OPENAI_API_KEY`: Required for promo extraction
- `OPENAI_ASSISTANT_ID`: Optional, if provided uses Assistant API instead of Chat Completion

### Frontend
The frontend expects the backend API at `http://localhost:3333/api` (hardcoded in `src/api/client.ts`).

## Testing

Backend uses Japa test runner with two suites:
- `unit`: Tests in `tests/unit/**/*.spec.ts` (2s timeout)
- `functional`: Tests in `tests/functional/**/*.spec.ts` (30s timeout)

## Common Workflows

**Adding a new model**:
1. Create migration: `node ace make:migration create_<table>_table`
2. Create model in `app/models/` with Lucid decorators
3. Add relationships if needed
4. Update path alias imports

**Adding a new controller**:
1. Create in `app/controllers/` with methods matching route actions
2. Add import and route in `start/routes.ts`
3. Use `#controllers/*` path alias

**Adding a new service**:
1. Create in `app/services/`
2. Add `@inject()` if it has dependencies
3. Inject into controllers or other services
4. Use `#services/*` path alias

**Modifying OAuth scopes**:
Gmail scopes are defined in `GmailOAuthService`. If changing scopes, users must re-authenticate.

**Running scans**:
Scans can be triggered via API (`POST /api/scans`) which creates a ScanJob, or manually via `node ace scan:promos` command for processing pending jobs.
