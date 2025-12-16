/**
 * Test feed fixtures
 */

export const TEST_FEED_TEMPLATES = {
  forage: {
    fd_type: 'Forage',
    fd_category: 'Grass',
    fd_name: 'Test Grass',
    fd_dm: 90.0,
    fd_ash: 8.0,
    fd_cp: 12.0,
    fd_ee: 2.5,
    fd_cf: 25.0,
    fd_nfe: 40.0,
  },
  concentrate: {
    fd_type: 'Concentrate',
    fd_category: 'Grain',
    fd_name: 'Test Grain',
    fd_dm: 88.0,
    fd_ash: 3.0,
    fd_cp: 10.0,
    fd_ee: 3.0,
    fd_cf: 5.0,
    fd_nfe: 65.0,
  },
  mineral: {
    fd_type: 'Mineral',
    fd_category: 'Calcium',
    fd_name: 'Test Calcium',
    fd_dm: 95.0,
    fd_ash: 35.0,
    fd_cp: 0.0,
    fd_ee: 0.0,
    fd_cf: 0.0,
    fd_nfe: 0.0,
  },
};

/**
 * Get test feed data with unique name
 */
export function getTestFeedData(
  type: 'forage' | 'concentrate' | 'mineral' = 'forage',
  countryCode: string = 'IND'
): any {
  const timestamp = Date.now();
  const template = TEST_FEED_TEMPLATES[type];

  return {
    ...template,
    fd_code: `TEST-${countryCode}-${timestamp}`,
    fd_name: `${template.fd_name} ${timestamp}`,
    fd_country_cd: countryCode,
  };
}

