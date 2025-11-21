# Git Hooks Configuration (Monorepo)

This project uses [Husky](https://typicode.github.io/husky/) at the root level to manage Git hooks for the entire monorepo (backend + frontend).

## Pre-commit Hook

The pre-commit hook automatically runs the following checks:

### 1. 🧹 Lint-Staged

Runs on staged files only:

- **Backend** (`backend/**/*.ts`): ESLint + Prettier
- **Frontend** (`frontend/src/**/*.{ts,tsx}`): ESLint + Prettier
- **Root** (`*.{json,md}`): Prettier

### 2. 🔍 TypeScript Type Check (Backend)

Runs full project type checking with `tsc --noEmit`

- **Blocking**: Commit will fail if there are TypeScript errors in backend

### 3. 🧪 Tests (Backend)

Runs the full test suite with `npm test`

- **Blocking**: Commit will fail if tests don't pass

## Configuration Files

- **Husky hooks**: `.husky/pre-commit` (at root)
- **Lint-staged config**: Root `package.json` → `lint-staged` section
- **Backend ESLint**: `backend/eslint.config.js`
- **Frontend ESLint**: `frontend/eslint.config.js`
- **Backend TypeScript**: `backend/tsconfig.json`
- **Frontend TypeScript**: `frontend/tsconfig.json`
- **Backend Prettier**: `backend/package.json` → extends `@adonisjs/prettier-config`
- **Frontend Prettier**: `frontend/.prettierrc`

## Manual Commands

You can run these checks manually from the root:

```bash
# Backend checks
npm run lint:backend
npm run typecheck:backend
npm run test:backend
npm run format:backend

# Frontend checks
npm run lint:frontend
npm run format:frontend

# Or run from specific workspace
cd backend && npm run lint
cd frontend && npm run lint
```

## Skipping Hooks (Not Recommended)

In rare cases where you need to skip the pre-commit hook:

```bash
git commit --no-verify -m "Your message"
```

⚠️ **Warning**: Only use this in emergencies. Always ensure code quality before pushing.

## Monorepo Structure

```
guard-inbox/
├── .husky/              # Git hooks (root level)
│   └── pre-commit
├── backend/             # AdonisJS backend
│   ├── .husky/          # (deprecated - ignore)
│   └── package.json
├── frontend/            # React frontend
│   └── package.json
└── package.json         # Root config with husky + lint-staged
```

## Why at Root Level?

Husky must be at the root of the Git repository to work properly. The `.git` folder is at the root level, so Husky needs to be installed there to intercept Git hooks for the entire monorepo.
