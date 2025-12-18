# Claude Code Instructions for RationSmart PWA

## E2E Testing Rules

### Before Running Tests
1. **ALWAYS clear test results folders before running tests:**
   ```bash
   rm -rf e2e/test-results/* e2e/playwright-report/*
   ```

2. **ALWAYS run E2E tests from the `pwa` directory:**
   ```bash
   cd /Users/eagleisbatman/digitalgreen_projects/rationsmart/pwa
   npm run test:e2e -- <test-file>
   ```

3. **NEVER run tests from any other directory** - the paths in the tests are relative to the `pwa` folder.

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- complete-user-journey.spec.ts

# Run with UI mode
npm run test:e2e:ui

# View HTML report after test
npm run test:e2e:report
```

### Test Results Location
- Screenshots: `e2e/test-results/`
- Videos: `e2e/test-results/<test-name>/video.webm`
- HTML Report: `e2e/playwright-report/index.html`

## Security Rules

### NEVER Commit Sensitive Information
- `.env` files
- `.env.local` files
- API keys, tokens, or credentials
- Personal user data or test user credentials
- Database connection strings

### Files to Check Before Committing
```bash
git diff --cached --name-only | grep -E "\.env|credentials|secrets|password|token|key"
```

## Project Structure
- `/app` - Next.js App Router pages
- `/components` - React components
- `/store` - Zustand state management (with persist middleware)
- `/lib` - Utilities and API client
- `/e2e` - Playwright E2E tests

## State Management
All Zustand stores use `persist` middleware to survive page navigation:
- `auth-store.ts` - User authentication
- `cattle-info-store.ts` - Cattle information form data
- `feed-store.ts` - Selected feeds

## Backend API
- Backend URL: `http://47.128.1.51:8000`
- API is proxied through Next.js at `/api/proxy/`
- Diet recommendation requires at least 4 feeds for the NSGA-II algorithm to find an optimal solution
