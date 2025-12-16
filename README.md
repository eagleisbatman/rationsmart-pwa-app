# RationSmart PWA

A Progressive Web Application for AI-powered cattle feed formulation and diet optimization. Built with Next.js 16, React 19, TypeScript, and comprehensive Playwright testing.

## Overview

RationSmart helps dairy farmers and nutritionists create optimal, cost-effective feed formulations for cattle. The app uses AI-powered recommendations to balance nutrition, minimize costs, and reduce environmental impact.

## Features

### User Features
- **Cattle Information Management** - Comprehensive cattle data entry (breed, weight, lactation status, etc.)
- **Feed Selection** - Hierarchical feed classification (Type → Category → Subcategory)
- **AI Recommendations** - Optimized diet formulations with cost analysis
- **Reports** - Save, view, and download PDF reports
- **User Feedback** - Submit feedback and ratings

### Admin Features
- **User Management** - View and manage all users
- **Feed Management** - Add, edit, delete feeds with nutritional data
- **Bulk Upload** - Import feeds in bulk
- **Feedback & Reports** - View all user feedback and reports

### Technical Features
- **PWA Support** - Installable, offline-capable
- **Responsive Design** - Mobile-first with desktop support
- **Dark/Light Theme** - System preference detection + manual toggle
- **Type Safety** - Full TypeScript with Zod validation

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Components | shadcn/ui (Radix UI) |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Testing | Playwright |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running (see backend repo)

### Installation

```bash
# Clone the repository
git clone https://github.com/eagleisbatman/rationsmart-pwa-app.git
cd rationsmart-pwa-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://your-api-url:8000

# Database (for E2E tests)
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=your-db-name
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run all Playwright tests |
| `npm run test:e2e:ui` | Run tests in interactive UI mode |
| `npm run test:e2e:headed` | Run tests with visible browser |
| `npm run test:e2e:debug` | Run tests in debug mode |

## Testing

The project includes comprehensive E2E testing with Playwright:

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- auth.spec.ts

# Interactive UI mode (recommended for debugging)
npm run test:e2e:ui

# View test report
npx playwright show-report
```

### Test Suites

| Suite | Coverage |
|-------|----------|
| `auth.spec.ts` | Authentication flows |
| `feed-formulation.spec.ts` | Feed selection & recommendations |
| `admin.spec.ts` | Admin panel features |
| `mobile-responsive.spec.ts` | Responsive design |
| `api-integration.spec.ts` | API endpoints |
| `database.spec.ts` | Data integrity |
| `pwa.spec.ts` | PWA features |
| `error-handling.spec.ts` | Error scenarios |
| `performance.spec.ts` | Performance metrics |

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   └── (main)/            # Protected pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── ...               # Feature components
├── lib/                   # Utilities
│   ├── api/              # API client & endpoints
│   └── types/            # TypeScript types
├── store/                 # Zustand stores
├── e2e/                   # Playwright tests
│   ├── helpers/          # Test utilities
│   └── fixtures/         # Test data
├── docs/                  # Documentation
└── public/               # Static assets
```

## Documentation

See the `docs/` folder for detailed documentation:

- [Testing Guide](docs/TESTING_GUIDE.md)
- [How to Run Tests](docs/HOW_TO_RUN_TESTS.md)
- [PWA Review](docs/PWA_RESPONSIVE_REVIEW.md)
- [Admin Review](docs/ADMIN_REVIEW.md)

## License

Private - Digital Green

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test:e2e`
4. Submit a pull request
