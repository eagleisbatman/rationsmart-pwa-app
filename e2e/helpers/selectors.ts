/**
 * Centralized selectors for E2E tests
 * Use these constants instead of hardcoded selectors throughout test files
 */

export const SELECTORS = {
  // Tables (shadcn/ui uses data-slot attributes)
  TABLE: '[data-slot="table"], table',
  TABLE_BODY: '[data-slot="table-body"], tbody',
  TABLE_ROW: '[data-slot="table-row"], tr',
  TABLE_CELL: '[data-slot="table-cell"], td',
  TABLE_HEADER: '[data-slot="table-header"], th',

  // Toast Notifications (Sonner library)
  TOAST: '[data-sonner-toast]',
  TOAST_SUCCESS: '[data-sonner-toast][data-type="success"]',
  TOAST_ERROR: '[data-sonner-toast][data-type="error"]',
  TOAST_INFO: '[data-sonner-toast][data-type="info"]',
  TOAST_WARNING: '[data-sonner-toast][data-type="warning"]',
  TOAST_CONTAINER: '[data-sonner-toaster]',

  // Form Elements
  SUBMIT_BUTTON: 'button[type="submit"]',
  INPUT_EMAIL: 'input[name="email_id"]',
  INPUT_PIN: 'input[name="pin"]',
  INPUT_NAME: 'input[name="name"]',
  INPUT_SEARCH: 'input[placeholder*="Search"], input[type="search"]',

  // Select/Combobox (shadcn/ui)
  SELECT_TRIGGER: '[data-slot="select-trigger"], [role="combobox"]',
  SELECT_CONTENT: '[data-slot="select-content"], [role="listbox"]',
  SELECT_ITEM: '[data-slot="select-item"], [role="option"]',

  // Mobile Navigation
  DRAWER_TRIGGER: 'button[aria-label="Open menu"]',
  DRAWER_CONTENT: '[data-slot="sheet-content"], [role="dialog"]',
  DRAWER_CLOSE: '[data-slot="sheet-close"]',
  BOTTOM_NAV: 'nav[data-testid="bottom-nav"], nav.fixed.bottom-0',
  HAMBURGER_MENU: 'button[aria-label="Open menu"], button[aria-label="Menu"]',

  // Admin Panel
  ADMIN_SIDEBAR: '[data-testid="admin-sidebar"]',
  ADMIN_USER_ROW: '[data-testid="user-row"]',
  ADMIN_FEED_ROW: '[data-testid="feed-row"]',
  TOGGLE_BUTTON: 'button:has-text("Toggle"), button:has-text("Activate"), button:has-text("Deactivate")',

  // Pagination
  PAGINATION_NEXT: 'button:has-text("Next")',
  PAGINATION_PREV: 'button:has-text("Previous")',
  PAGINATION_CONTAINER: '[data-testid="pagination"], nav[aria-label="pagination"]',

  // Dialogs/Modals
  DIALOG: '[role="dialog"]',
  DIALOG_CLOSE: '[data-slot="dialog-close"], button[aria-label="Close"]',
  ALERT_DIALOG: '[role="alertdialog"]',

  // Loading States
  LOADING_SPINNER: '[data-testid="loading"], .animate-spin',
  SKELETON: '[data-slot="skeleton"], .animate-pulse',

  // Error States
  ERROR_MESSAGE: '[role="alert"], .text-destructive, .text-red-500',
  FORM_ERROR: '[data-slot="form-message"], .text-destructive',

  // Cards
  CARD: '[data-slot="card"]',
  CARD_HEADER: '[data-slot="card-header"]',
  CARD_CONTENT: '[data-slot="card-content"]',

  // Buttons
  BUTTON_PRIMARY: 'button.bg-primary, button[data-variant="default"]',
  BUTTON_DESTRUCTIVE: 'button.bg-destructive, button[data-variant="destructive"]',
  BUTTON_OUTLINE: 'button[data-variant="outline"]',
};

/**
 * Standard timeouts for different operations
 */
export const TIMEOUTS = {
  // Element visibility
  ELEMENT: 10000,
  ELEMENT_SHORT: 5000,

  // Page operations
  PAGE_LOAD: 15000,
  NAVIGATION: 10000,

  // API operations
  API: 30000,
  API_SHORT: 10000,

  // Animations and transitions
  ANIMATION: 500,
  TRANSITION: 300,

  // Debounce operations
  DEBOUNCE: 1500,
  SEARCH_DEBOUNCE: 1000,

  // Toast notifications
  TOAST: 5000,
  TOAST_DISMISS: 3000,

  // Form submissions
  FORM_SUBMIT: 15000,

  // File operations
  DOWNLOAD: 30000,
  UPLOAD: 60000,
};

/**
 * Common URL patterns
 */
export const URL_PATTERNS = {
  LOGIN: '/login',
  REGISTER: '/register',
  CATTLE_INFO: '/cattle-info',
  FEED_SELECTION: '/feed-selection',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_FEEDS: '/admin/feeds',
};

/**
 * Test data constants
 */
export const TEST_DATA = {
  VALID_PIN: '1234',
  INVALID_PIN: '12',
  VALID_EMAIL_DOMAIN: '@example.com',
  TEST_USER_PREFIX: 'test-',
};

/**
 * Helper function to create a dynamic selector with text
 */
export function textSelector(text: string, tag: string = '*'): string {
  return `${tag}:has-text("${text}")`;
}

/**
 * Helper function to create a case-insensitive text selector
 */
export function textSelectorInsensitive(pattern: string): string {
  return `text=/${pattern}/i`;
}
