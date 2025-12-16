/**
 * Test user fixtures
 * Note: These are templates - actual users will be created with unique emails
 */

export const TEST_USER_TEMPLATES = {
  regular: {
    name: 'Test User',
    pin: '1234',
    // countryId will be set from actual country data
  },
  admin: {
    name: 'Test Admin',
    pin: '5678',
    isAdmin: true,
    // countryId will be set from actual country data
  },
};

/**
 * Get test user data with unique email
 */
export function getTestUserData(
  type: 'regular' | 'admin' = 'regular',
  countryId: string
): {
  name: string;
  email: string;
  pin: string;
  countryId: string;
  isAdmin?: boolean;
} {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const template = TEST_USER_TEMPLATES[type];

  return {
    name: template.name,
    email: `test-${type}-${timestamp}-${random}@example.com`,
    pin: template.pin,
    countryId,
    ...(type === 'admin' && { isAdmin: true }),
  };
}

