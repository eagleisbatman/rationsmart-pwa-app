/**
 * Generate test data for various entities
 */

/**
 * Generate cattle information test data
 */
export function generateCattleInfo(overrides?: Partial<any>): any {
  return {
    name: 'Test Cattle',
    country: 'India',
    location: 'Test Location',
    language: 'en',
    lactating: true,
    body_weight: 500,
    breed: 'Holstein',
    tp_milk: 3.2,
    fat_milk: 4.0,
    lactose_milk: 4.8,
    days_in_milk: 150,
    milk_production: 25,
    days_of_pregnancy: 0,
    calving_interval: 365,
    parity: 2,
    topography: 'Plain',
    housing: 'Free Stall',
    temperature: 25,
    feeds: [],
    ...overrides,
  };
}

/**
 * Generate feed test data
 */
export function generateFeedData(overrides?: Partial<any>): any {
  return {
    fd_code: `TEST-${Date.now()}`,
    fd_name: `Test Feed ${Date.now()}`,
    fd_type: 'Forage',
    fd_category: 'Grass',
    fd_country_cd: 'IND',
    fd_dm: 90.0,
    fd_ash: 8.0,
    fd_cp: 12.0,
    fd_ee: 2.5,
    fd_cf: 25.0,
    fd_nfe: 40.0,
    fd_st: 5.0,
    fd_ndf: 50.0,
    fd_adf: 30.0,
    fd_lg: 5.0,
    fd_ndin: 0.5,
    fd_adin: 0.2,
    fd_ca: 0.8,
    fd_p: 0.3,
    fd_npn_cp: 0,
    fd_hemicellulose: 20.0,
    fd_cellulose: 25.0,
    ...overrides,
  };
}

/**
 * Generate feed recommendation request
 */
export function generateFeedRecommendationRequest(
  cattleInfo: any,
  feeds: any[]
): any {
  return {
    ...cattleInfo,
    feeds: feeds.map((feed) => ({
      feed_name: feed.fd_name || feed.name,
      feed_type: feed.fd_type || feed.type,
      feed_category: feed.fd_category || feed.category,
      country_name: feed.fd_country_name || feed.country_name,
      country_code: feed.fd_country_cd || feed.country_code,
      ...feed,
    })),
  };
}

/**
 * Generate feedback test data
 */
export function generateFeedbackData(overrides?: Partial<any>): any {
  return {
    feedback_type: 'general',
    text_feedback: 'This is a test feedback',
    overall_rating: 5,
    ...overrides,
  };
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random email
 */
export function randomEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${randomString(6)}@example.com`;
}

/**
 * Generate random PIN
 */
export function randomPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

