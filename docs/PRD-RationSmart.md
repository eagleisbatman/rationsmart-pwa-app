# RationSmart PWA - Product Requirements Document

## Executive Summary

RationSmart is a cattle nutrition optimization platform that uses NSGA-II multi-objective optimization to generate least-cost diet recommendations while meeting all nutritional requirements and minimizing environmental impact (methane emissions).

---

## 1. Core Application Features

### 1.1 User Authentication

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Registration | `POST /auth/register` | Email + 4-digit PIN + Name + Country |
| Login | `POST /auth/login/` | Email + PIN authentication |
| Forgot PIN | `POST /auth/forgot-pin/` | Email-based PIN reset |
| Change PIN | `POST /auth/change-pin/` | Update PIN (requires current PIN) |
| Delete Account | `POST /auth/user-delete-account` | Account deletion with PIN verification |
| Get Profile | `GET /auth/user/{email}` | Retrieve user data |
| Update Profile | `PUT /auth/user/{email}` | Update user information |
| List Countries | `GET /auth/countries/` | Active countries for registration |

### 1.2 Cattle Information Management

**Required Parameters:**
- Breed (Holstein, Jersey, Crossbred, Indigenous)
- Body Weight (kg)
- Body Condition Score (1-5)
- Lactating status (boolean)
- Milk Production (L/day) - if lactating
- Milk Fat % (e.g., 3.8%)
- Milk Protein % (e.g., 3.2%)
- Days in Milk (DIM)
- Days of Pregnancy
- Temperature (°C)
- Topography (Flat, Hilly, Mountainous)
- Grazing status

**Storage:** Zustand `useCattleInfoStore` with localStorage persistence

### 1.3 Feed Selection System

**Hierarchical Structure:**
1. Feed Type (Forage, Concentrate, Mineral, etc.)
2. Feed Category (Hay, Silage, Grain, etc.)
3. Feed Name (specific feed with nutritional data)

**Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `GET /unique-feed-type/{country_id}/{user_id}` | Get available feed types |
| `GET /unique-feed-category` | Get categories for type |
| `GET /feed-name/` | Get feed names for category |
| `GET /feed-details/{user_id}/{feed_id}` | Get full nutritional data |
| `POST /check-insert-or-update/` | Validate feed selection |

**Each Feed Contains:**
- Dry Matter (DM) %
- Crude Protein (CP)
- NDF, ADF, Crude Fiber
- Energy values (NEL, ME)
- Calcium (Ca), Phosphorus (P)
- Cost per kg

### 1.4 Diet Recommendation Generation

**Endpoint:** `POST /diet-recommendation-working/`

**Input:**
```json
{
  "simulation_id": "sim_timestamp",
  "user_id": "uuid",
  "cattle_info": { /* all cattle parameters */ },
  "feed_selection": [
    { "feed_id": "uuid", "price_per_kg": 15 }
  ]
}
```

**Algorithm:** NSGA-II (Non-dominated Sorting Genetic Algorithm II)
- Minimizes: Total diet cost
- Maximizes: Nutritional adequacy
- Minimizes: Methane emissions

**Output:**
```json
{
  "report_info": {
    "simulation_id": "...",
    "report_id": "...",
    "generated_date": "...",
    "user_name": "..."
  },
  "solution_summary": {
    "daily_cost": 45.50,
    "milk_production": "25.0 L/day",
    "dry_matter_intake": "22.5 kg/day"
  },
  "least_cost_diet": [
    {
      "feed_name": "Corn Silage",
      "quantity_kg_per_day": 15,
      "price_per_kg": 8,
      "daily_cost": 120
    }
  ],
  "total_diet_cost": 45.50,
  "environmental_impact": {
    "estimated_methane_kg_per_day": 0.85
  },
  "additional_information": {
    "warnings": ["High phosphorus level"],
    "recommendations": ["Consider reducing concentrate"]
  }
}
```

### 1.5 Diet Evaluation

**Endpoint:** `POST /diet-evaluation-working/`

Analyzes farmer's existing diet for:
- Nutritional adequacy vs requirements
- Cost efficiency (cost per liter milk)
- Production potential
- Limiting factors
- Methane emissions

### 1.6 Report & PDF Generation

**Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `POST /save-report/` | Save recommendation to user's reports |
| `POST /generate-pdf-report/` | Generate PDF from recommendation |
| `GET /pdf-reports/{user_id}` | List user's reports |
| `GET /pdf-report/{report_id}/{user_id}` | Download PDF |
| `DELETE /pdf-report/{report_id}/{user_id}` | Delete report |

**PDF Contents:**
- Cattle information summary
- Recommended diet with quantities
- Feed-by-feed breakdown
- Nutritional analysis vs requirements
- Cost breakdown
- Environmental impact
- Warnings and recommendations

### 1.7 Feedback System

**Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `POST /user-feedback/submit` | Submit feedback |
| `GET /user-feedback/my` | Get user's feedback history |

**Feedback Types:**
- General
- Defect
- Feature Request

**Fields:**
- feedback_type (required)
- overall_rating (1-5)
- text_feedback (required)

### 1.8 Custom Feeds

**Endpoint:** `POST /insert-custom-feed/`

Allows users to add farm-specific feeds with:
- Custom name, category, type
- All nutritional parameters
- Cost per kg
- User-scoped visibility

---

## 2. Admin Features

### 2.1 User Management
- `GET /admin/users` - List all users with filters
- Toggle user active/inactive status
- Search by name/email
- Filter by country/status

### 2.2 Feed Database Management
- CRUD operations on standard feeds
- Feed type and category management
- Bulk upload via Excel/CSV

### 2.3 Bulk Upload
**Endpoint:** `POST /admin/bulk-upload`
- Excel/CSV file with feed data
- Row-by-row validation
- Detailed error reporting
- Transaction-safe imports

### 2.4 Feedback Management
- View all user feedback
- Statistics: total count, average rating, distribution by type

### 2.5 Report Management
- View all user reports
- Download/delete reports
- Filter by user, date range

---

## 3. Technical Architecture

### 3.1 Frontend Stack
- Next.js 16 with App Router
- React 19
- TypeScript
- Zustand (state management with persistence)
- shadcn/ui components
- Tailwind CSS
- PWA with offline support

### 3.2 Backend Stack
- FastAPI (Python)
- PostgreSQL with SQLAlchemy ORM
- pymoo (NSGA-II optimization)
- WeasyPrint (PDF generation)
- AWS S3 (report storage)

### 3.3 Key Stores
| Store | Purpose |
|-------|---------|
| `useAuthStore` | User session, token, isAuthenticated |
| `useCattleInfoStore` | Current cattle parameters |
| `useFeedStore` | Selected feeds with prices |

---

## 4. User Flows

### 4.1 Complete Recommendation Flow
```
Login → Cattle Info → Feed Selection → Generate Recommendation → View Results → Save Report → Download PDF
```

### 4.2 Feed Selection Flow
```
Select Country → Select Feed Type → Select Category → Select Feed Name → Enter Price → Add to Selection → Repeat
```

### 4.3 Evaluation Flow
```
Login → Cattle Info → Feed Selection with Quantities → Run Evaluation → View Analysis
```

---

## 5. Critical Test Requirements

### 5.1 Authentication Tests
- [ ] Registration with valid data creates user
- [ ] Registration with duplicate email fails
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong PIN fails
- [ ] PIN change updates credentials
- [ ] Account deletion removes user data

### 5.2 Feed Selection Tests
- [ ] Feed types load for country
- [ ] Categories load when type selected
- [ ] Feed names load when category selected
- [ ] Feed details show nutritional data
- [ ] Multiple feeds can be selected
- [ ] Feeds can be removed from selection
- [ ] Prices are validated (positive numbers)

### 5.3 Recommendation Tests
- [ ] Recommendation generates with valid inputs
- [ ] Recommendation fails gracefully with no feeds
- [ ] Recommendation includes all cattle info
- [ ] Output contains diet breakdown
- [ ] Output contains cost analysis
- [ ] Output contains methane estimate
- [ ] Warnings are generated when appropriate

### 5.4 Report Tests
- [ ] Report can be saved
- [ ] Saved reports appear in list
- [ ] PDF can be downloaded
- [ ] Report can be deleted
- [ ] Report metadata is accurate

### 5.5 Feedback Tests
- [ ] Feedback can be submitted
- [ ] All feedback types work
- [ ] Rating is captured
- [ ] Feedback history shows submissions

### 5.6 Admin Tests
- [ ] Admin can view user list
- [ ] Admin can search users
- [ ] Admin can toggle user status
- [ ] Admin can view/add/edit/delete feeds
- [ ] Bulk upload processes files
- [ ] Admin can view all feedback

---

## 6. API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error, empty feeds) |
| 401 | Unauthorized (login required) |
| 403 | Forbidden (admin-only) |
| 404 | Not found |
| 409 | Conflict (duplicate email) |
| 500 | Server error |

---

## 7. Known Issues to Test

1. **Feed data not loading** - Need to verify actual API calls succeed and data renders
2. **Auth state persistence** - Verify Zustand store persists correctly
3. **Recommendation calculation** - Test with real feed combinations
4. **PDF generation** - Verify actual PDF files are downloadable
5. **Offline functionality** - Test PWA behavior offline

---

## 8. Test Data Requirements

### Test User
- Valid email (unique per test)
- PIN: 1234 (default)
- Country: India (or first active country)

### Test Cattle Info
```javascript
{
  breed: "Holstein",
  body_weight: 500,
  body_condition_score: 3,
  lactating: true,
  milk_production: 20,
  fat_milk: 4.0,
  tp_milk: 3.5,
  dim: 100,
  pregnancy_days: 0,
  temperature: 25,
  topography: "Flat",
  grazing: false
}
```

### Test Feed Selection
- Minimum 3 feeds from different types
- Include at least: 1 Forage, 1 Concentrate
- Realistic prices per kg
