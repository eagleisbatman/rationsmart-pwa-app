/**
 * Global teardown for E2E tests
 * Outputs latency metrics report after all tests complete
 */

import { latencyTracker } from './helpers/latency-tracker';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown() {
  const report = latencyTracker.getReport();

  // Print report to console
  if (report.totalRequests > 0) {
    latencyTracker.printReport();
  } else {
    console.log('\n📊 No API latency metrics recorded during test run.\n');
  }

  // Save report to JSON file for HTML report integration
  const reportDir = path.join(__dirname, 'playwright-report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'latency-metrics.json');
  fs.writeFileSync(reportPath, latencyTracker.toJSON());
  console.log(`📁 Latency metrics saved to: ${reportPath}\n`);
}

export default globalTeardown;
