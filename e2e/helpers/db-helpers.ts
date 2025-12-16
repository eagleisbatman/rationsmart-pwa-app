import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

/**
 * Execute a database query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDbPool();
  return db.query<T>(text, params);
}

/**
 * Verify database connection
 */
export async function verifyDbConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error: any) {
    // Log error but don't fail tests - database might not be accessible
    console.warn('Database connection failed (tests may skip DB-dependent tests):', error.message);
    return false;
  }
}

/**
 * Delete a test user by email
 */
export async function deleteTestUser(email: string): Promise<void> {
  try {
    // First delete related data (handle missing tables gracefully)
    try {
      await query(`
        DELETE FROM user_feedback WHERE user_id IN (
          SELECT id FROM user_information WHERE email_id = $1
        )
      `, [email]);
    } catch (error: any) {
      if (error.code !== '42P01') { // Ignore "relation does not exist" errors
        console.warn(`Failed to delete user_feedback for ${email}:`, error.message);
      }
    }
    
    try {
      // Try diet_reports table (actual table name in database)
      await query(`
        DELETE FROM diet_reports WHERE user_id IN (
          SELECT id FROM user_information WHERE email_id = $1
        )
      `, [email]);
    } catch (error: any) {
      if (error.code !== '42P01') { // Ignore "relation does not exist" errors
        console.warn(`Failed to delete diet_reports for ${email}:`, error.message);
      }
    }
    
    // Also try reports table if it exists
    try {
      await query(`
        DELETE FROM reports WHERE user_id IN (
          SELECT id FROM user_information WHERE email_id = $1
        )
      `, [email]);
    } catch (error: any) {
      if (error.code !== '42P01') {
        // Ignore silently
      }
    }
    
    // Then delete user
    await query('DELETE FROM user_information WHERE email_id = $1', [email]);
  } catch (error: any) {
    // Log but don't throw - cleanup failures shouldn't fail tests
    if (error.code !== '42P01') {
      console.error(`Failed to delete test user ${email}:`, error.message);
    }
  }
}

/**
 * Delete a test user by ID
 */
export async function deleteTestUserById(userId: string): Promise<void> {
  try {
    await query('DELETE FROM user_information WHERE id = $1', [userId]);
  } catch (error) {
    console.error(`Failed to delete test user ${userId}:`, error);
  }
}

/**
 * Delete a test feed by ID
 */
export async function deleteTestFeed(feedId: string): Promise<void> {
  try {
    await query('DELETE FROM feeds WHERE id = $1', [feedId]);
  } catch (error) {
    console.error(`Failed to delete test feed ${feedId}:`, error);
  }
}

/**
 * Delete test feeds by name pattern
 */
export async function deleteTestFeedsByNamePattern(pattern: string): Promise<void> {
  try {
    await query('DELETE FROM feeds WHERE fd_name LIKE $1', [`%${pattern}%`]);
  } catch (error) {
    console.error(`Failed to delete test feeds with pattern ${pattern}:`, error);
  }
}

/**
 * Delete a test report by ID
 */
export async function deleteTestReport(reportId: string): Promise<void> {
  try {
    await query('DELETE FROM user_reports WHERE id = $1', [reportId]);
  } catch (error) {
    console.error(`Failed to delete test report ${reportId}:`, error);
  }
}

/**
 * Delete test reports by user ID
 */
export async function deleteTestReportsByUserId(userId: string): Promise<void> {
  try {
    await query('DELETE FROM user_reports WHERE user_id = $1', [userId]);
  } catch (error) {
    console.error(`Failed to delete test reports for user ${userId}:`, error);
  }
}

/**
 * Delete test feedback by user ID
 */
export async function deleteTestFeedbackByUserId(userId: string): Promise<void> {
  try {
    await query('DELETE FROM user_feedback WHERE user_id = $1', [userId]);
  } catch (error) {
    console.error(`Failed to delete test feedback for user ${userId}:`, error);
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<any> {
  const result = await query(
    'SELECT * FROM user_information WHERE email_id = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<any> {
  const result = await query(
    'SELECT * FROM user_information WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Get feed by ID
 */
export async function getFeedById(feedId: string): Promise<any> {
  const result = await query('SELECT * FROM feeds WHERE id = $1', [feedId]);
  return result.rows[0] || null;
}

/**
 * Get report by ID
 */
export async function getReportById(reportId: string): Promise<any> {
  const result = await query('SELECT * FROM user_reports WHERE id = $1', [reportId]);
  return result.rows[0] || null;
}

/**
 * Get country by code
 */
export async function getCountryByCode(countryCode: string): Promise<any> {
  const result = await query(
    'SELECT * FROM country WHERE country_code = $1 AND is_active = true',
    [countryCode]
  );
  return result.rows[0] || null;
}

/**
 * Cleanup all test data (users, feeds, reports, feedback)
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // Delete test users (by email pattern)
    await query(
      "DELETE FROM user_information WHERE email_id LIKE '%test-%@example.com'"
    );
    
    // Delete test feeds (by name pattern)
    await query("DELETE FROM feeds WHERE fd_name LIKE 'TEST-%'");
    
    // Delete test reports (orphaned or by test users)
    await query(`
      DELETE FROM user_reports 
      WHERE user_id IN (
        SELECT id FROM user_information 
        WHERE email_id LIKE '%test-%@example.com'
      )
    `);
    
    // Delete test feedback
    await query(`
      DELETE FROM user_feedback 
      WHERE user_id IN (
        SELECT id FROM user_information 
        WHERE email_id LIKE '%test-%@example.com'
      )
    `);
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
}

/**
 * Close database connection pool
 */
export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

