# E2E Testing Suite for RationSmart PWA

This directory contains end-to-end tests using Playwright to validate all user flows, API integrations, database operations, and PWA features.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the project root with:
   ```
   NEXT_PUBLIC_API_URL=http://your-api-url:8000
   POSTGRES_HOST=your-db-host
   POSTGRES_PORT=5432
   POSTGRES_USER=your-db-user
   POSTGRES_PASSWORD=your-db-password
   POSTGRES_DB=your-db-name
   ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test suite
```bash
npm run test:e2e -- auth.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

## Test Suites

- **auth.spec.ts** - Authentication flow tests (registration, login, profile, etc.)
- **feed-formulation.spec.ts** - Feed formulation workflow tests
- **admin.spec.ts** - Admin feature tests
- **api-integration.spec.ts** - API integration and error handling tests
- **database.spec.ts** - Database integrity and constraint tests
- **pwa.spec.ts** - PWA features (manifest, service worker, responsive design)
- **error-handling.spec.ts** - Error handling and edge cases
- **performance.spec.ts** - Performance and load time tests

## Test Helpers

Located in `e2e/helpers/`:
- **api-helpers.ts** - API client and endpoint functions
- **db-helpers.ts** - Database connection and query utilities
- **auth-helpers.ts** - Authentication helper functions
- **test-data.ts** - Test data generators

## Test Fixtures

Located in `e2e/fixtures/`:
- **test-users.ts** - Test user templates
- **test-feeds.ts** - Test feed templates

## Test Data Cleanup

Tests automatically clean up created test data:
- Test users are deleted after each test
- Test feeds are removed after admin tests
- Test reports and feedback are cleaned up

Test data is identified by:
- Email pattern: `test-*@example.com`
- Feed name pattern: `TEST-*`

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` branch
- Pushes to `main` branch

See `.github/workflows/e2e.yml` for CI configuration.

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports include:
- Test results and status
- Screenshots on failure
- Videos on failure
- Execution timeline

## Notes

- Tests use the existing database - ensure proper cleanup
- Tests require the backend API to be running
- Tests require database access for verification
- Some tests may be skipped if prerequisites aren't met (e.g., no feeds in database)

