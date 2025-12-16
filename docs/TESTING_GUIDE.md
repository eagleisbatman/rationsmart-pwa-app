# Comprehensive Testing Guide for RationSmart PWA

## Prerequisites

Before running tests, ensure you have:

1. **Node.js** installed (v20 or higher recommended)
2. **Dependencies** installed: `npm install`
3. **Playwright browsers** installed: `npx playwright install`
4. **Environment variables** configured (see below)
5. **Backend API** running and accessible
6. **Database** accessible with credentials

## Environment Setup

Create a `.env.local` file in the project root:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://your-api-url:8000

# Database Configuration (for database tests)
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=your-db-name

# Playwright Configuration (optional)
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_API_URL=http://your-api-url:8000
```

## Running Tests

### 1. Install Dependencies

```bash
# Install npm packages
npm install

# Install Playwright browsers
npx playwright install
```

### 2. Start Development Server

In one terminal, start the Next.js dev server:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or next available port).

### 3. Run All Tests

```bash
# Run all E2E tests
npm run test:e2e
```

This will:
- Run all test suites in parallel (where possible)
- Test on Chromium, Firefox, and WebKit browsers
- Test on mobile and desktop viewports
- Generate HTML report

### 4. Run Specific Test Suites

```bash
# Authentication tests only
npm run test:e2e -- auth.spec.ts

# Feed formulation tests only
npm run test:e2e -- feed-formulation.spec.ts

# Admin tests only
npm run test:e2e -- admin.spec.ts

# Mobile responsiveness tests only
npm run test:e2e -- mobile-responsive.spec.ts

# API integration tests only
npm run test:e2e -- api-integration.spec.ts

# Database tests only
npm run test:e2e -- database.spec.ts

# PWA features tests only
npm run test:e2e -- pwa.spec.ts

# Error handling tests only
npm run test:e2e -- error-handling.spec.ts

# Performance tests only
npm run test:e2e -- performance.spec.ts
```

### 5. Run Tests in UI Mode (Interactive)

```bash
# Open Playwright UI for interactive test running
npm run test:e2e:ui
```

This opens a visual interface where you can:
- See tests running in real-time
- Debug individual tests
- Step through test execution
- View screenshots and videos

### 6. Run Tests in Debug Mode

```bash
# Run tests with debugger attached
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through test code
- Inspect page state
- Debug test failures

### 7. Run Tests in Headed Mode (See Browser)

```bash
# Run tests with visible browser windows
npm run test:e2e:headed
```

Useful for:
- Watching tests execute
- Debugging visual issues
- Understanding test flow

### 8. Run Tests on Specific Browser

```bash
# Run only on Chromium
npm run test:e2e -- --project=chromium

# Run only on Firefox
npm run test:e2e -- --project=firefox

# Run only on WebKit (Safari)
npm run test:e2e -- --project=webkit

# Run only on Mobile Chrome
npm run test:e2e -- --project="Mobile Chrome"

# Run only on Mobile Safari
npm run test:e2e -- --project="Mobile Safari"
```

### 9. Run Tests with Specific Viewport

```bash
# Run tests with specific viewport size
npm run test:e2e -- --project="Mobile Chrome" --viewport-size=375,667
```

## Test Reports

### View HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results and status
- Execution timeline
- Screenshots on failure
- Videos on failure (if enabled)
- Test logs and traces

### Report Location

Reports are saved in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots and videos
- `playwright-report/results.json` - JSON report (for CI/CD)

## Test Suites Overview

### 1. Authentication Tests (`auth.spec.ts`)
- Splash screen navigation
- Welcome page
- User registration (no email sent)
- User login (success and failure)
- Forgot PIN flow
- Profile management
- Account deletion

### 2. Feed Formulation Tests (`feed-formulation.spec.ts`)
- Cattle information form
- Feed type selection
- Feed category and subcategory selection
- Feed recommendation generation
- Diet evaluation
- Save report
- View reports list
- Download PDF reports

### 3. Admin Tests (`admin.spec.ts`)
- Admin dashboard access
- User management (list, search, toggle status)
- Feed management (add, edit, delete)
- Feed types & categories management
- Bulk upload
- Feedback management
- Reports management

### 4. Mobile Responsiveness Tests (`mobile-responsive.spec.ts`)
- Hamburger menu opens drawer
- Drawer navigation works
- Bottom navigation visibility
- Touch targets meet 44x44px minimum
- Form inputs mobile-friendly
- Dialogs responsive
- Registration form mobile-friendly
- Login form mobile-friendly
- Safe area insets on iOS

### 5. API Integration Tests (`api-integration.spec.ts`)
- API connection test
- Authentication API (register, login)
- Feed API (types, categories, details)
- Recommendation API
- Reports API
- Feedback API
- Error handling (400, 401, timeout)

### 6. Database Tests (`database.spec.ts`)
- User data integrity
- PIN hash verification
- Foreign key constraints
- Feed data integrity
- Report data integrity
- Feedback data integrity
- Admin operations
- Unique constraints
- Timestamps

### 7. PWA Features Tests (`pwa.spec.ts`)
- Manifest file accessibility
- Manifest structure validation
- Service worker registration
- Offline functionality
- Responsive design (mobile, tablet, desktop)
- Theme switching (dark/light)
- Theme persistence
- System preference detection
- PWA installability
- App icons and favicon

### 8. Error Handling Tests (`error-handling.spec.ts`)
- Network errors
- API error responses (400, 401, 404, 500)
- Form validation
- Data edge cases
- Concurrent operations
- Session expiration
- Large dataset handling

### 9. Performance Tests (`performance.spec.ts`)
- Page load performance
- Time to interactive
- API response times
- Search debouncing
- Large dataset handling
- Image optimization
- Code splitting
- Bundle size
- Memory usage

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` branch
- Pushes to `main` branch

See `.github/workflows/e2e.yml` for CI configuration.

## Troubleshooting

### Tests Fail to Start

1. **Check if dev server is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_API_URL
   ```

3. **Check database connection:**
   ```bash
   # Test database connection manually
   psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB
   ```

### Tests Timeout

- Increase timeout in `e2e/playwright.config.ts`
- Check if API is responding slowly
- Verify network connectivity

### Database Errors

- Ensure database credentials are correct
- Check if test data cleanup is working
- Verify foreign key constraints

### Browser Installation Issues

```bash
# Reinstall browsers
npx playwright install --force
```

## Best Practices

1. **Run tests locally before committing**
2. **Fix failing tests immediately**
3. **Keep test data isolated** (uses test-* email pattern)
4. **Clean up test data** (automatic, but verify)
5. **Update tests when features change**
6. **Use descriptive test names**
7. **Add comments for complex test logic**

## Test Data Management

- Test users: Email pattern `test-*@example.com`
- Test feeds: Name pattern `TEST-*`
- Automatic cleanup after each test
- Database verification for critical operations

## Next Steps

1. Run all tests: `npm run test:e2e`
2. Review HTML report: `npx playwright show-report`
3. Fix any failing tests
4. Add new tests for new features
5. Update tests when APIs change

