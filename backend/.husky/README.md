# Git Hooks Configuration

This project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks and ensure code quality before commits.

## Pre-commit Hook

The pre-commit hook automatically runs the following checks:

### 1. 🧹 Lint-Staged

Runs on staged files only:

- **ESLint**: Auto-fixes code style issues
- **Prettier**: Formats code consistently

### 2. 🔍 TypeScript Type Check

Runs full project type checking with `tsc --noEmit`

- **Blocking**: Commit will fail if there are TypeScript errors

### 3. 🧪 Tests

Runs the full test suite with `npm test`

- **Blocking**: Commit will fail if tests don't pass

## Configuration Files

- **Husky hooks**: `.husky/pre-commit`
- **Lint-staged config**: `package.json` → `lint-staged` section
- **ESLint config**: `eslint.config.js`
- **TypeScript config**: `tsconfig.json`
- **Prettier config**: `package.json` → extends `@adonisjs/prettier-config`

## Manual Commands

You can run these checks manually:

```bash
# Run ESLint
npm run lint

# Run Prettier
npm run format

# Run TypeScript type check
npm run typecheck

# Run tests
npm test

# Run all checks (simulating pre-commit)
npm run lint && npm run typecheck && npm test
```

## Skipping Hooks (Not Recommended)

In rare cases where you need to skip the pre-commit hook:

```bash
git commit --no-verify -m "Your message"
```

⚠️ **Warning**: Only use this in emergencies. Always ensure code quality before pushing.

## TypeScript Errors

All TypeScript errors have been fixed! The type check is now blocking to ensure type safety going forward.
