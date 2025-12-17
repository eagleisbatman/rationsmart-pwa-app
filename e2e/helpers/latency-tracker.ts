/**
 * API Latency Tracker for E2E Tests
 * Captures timing metrics for all API calls during test execution
 */

export interface ApiMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: Date;
  testName?: string;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  count: number;
  minLatency: number;
  maxLatency: number;
  avgLatency: number;
  p50: number;
  p90: number;
  p95: number;
  successRate: number;
}

export interface LatencyReport {
  totalRequests: number;
  avgLatency: number;
  successRate: number;
  byEndpoint: EndpointStats[];
  slowestRequests: ApiMetric[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
}

class LatencyTracker {
  private metrics: ApiMetric[] = [];

  /**
   * Record a new API call metric
   */
  record(metric: Omit<ApiMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });
  }

  /**
   * Create a timing wrapper for API calls
   */
  async measure<T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>,
    testName?: string
  ): Promise<{ data: T; duration: number }> {
    const start = Date.now();
    let status = 200;
    let success = true;

    try {
      const data = await fn();
      const duration = Date.now() - start;

      this.record({
        endpoint,
        method,
        duration,
        status,
        success,
        testName,
      });

      return { data, duration };
    } catch (error: any) {
      const duration = Date.now() - start;
      status = error.response?.status || 500;
      success = false;

      this.record({
        endpoint,
        method,
        duration,
        status,
        success,
        testName,
      });

      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): ApiMetric[] {
    return [...this.metrics];
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, index)];
  }

  /**
   * Group metrics by endpoint and calculate stats
   */
  private groupByEndpoint(): EndpointStats[] {
    const groups = new Map<string, ApiMetric[]>();

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    }

    const stats: EndpointStats[] = [];

    for (const [key, metrics] of groups) {
      const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
      const successCount = metrics.filter((m) => m.success).length;

      stats.push({
        endpoint: metrics[0].endpoint,
        method: metrics[0].method,
        count: metrics.length,
        minLatency: Math.min(...durations),
        maxLatency: Math.max(...durations),
        avgLatency: Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length
        ),
        p50: this.percentile(durations, 50),
        p90: this.percentile(durations, 90),
        p95: this.percentile(durations, 95),
        successRate: Math.round((successCount / metrics.length) * 100),
      });
    }

    return stats.sort((a, b) => b.avgLatency - a.avgLatency);
  }

  /**
   * Generate comprehensive latency report
   */
  getReport(): LatencyReport {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        avgLatency: 0,
        successRate: 100,
        byEndpoint: [],
        slowestRequests: [],
        timeRange: { start: null, end: null },
      };
    }

    const durations = this.metrics.map((m) => m.duration);
    const successCount = this.metrics.filter((m) => m.success).length;
    const timestamps = this.metrics.map((m) => m.timestamp);

    return {
      totalRequests: this.metrics.length,
      avgLatency: Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      ),
      successRate: Math.round((successCount / this.metrics.length) * 100),
      byEndpoint: this.groupByEndpoint(),
      slowestRequests: [...this.metrics]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      timeRange: {
        start: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
        end: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
      },
    };
  }

  /**
   * Print formatted report to console
   */
  printReport(): void {
    const report = this.getReport();

    console.log('\n' + '='.repeat(80));
    console.log('📊 API LATENCY METRICS REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Requests: ${report.totalRequests}`);
    console.log(`   Average Latency: ${report.avgLatency}ms`);
    console.log(`   Success Rate: ${report.successRate}%`);

    if (report.timeRange.start && report.timeRange.end) {
      const durationMs =
        report.timeRange.end.getTime() - report.timeRange.start.getTime();
      console.log(`   Test Duration: ${Math.round(durationMs / 1000)}s`);
    }

    if (report.byEndpoint.length > 0) {
      console.log(`\n📋 By Endpoint:`);
      console.log(
        '─'.repeat(80)
      );
      console.log(
        `${'Endpoint'.padEnd(40)} ${'Avg'.padStart(8)} ${'P90'.padStart(8)} ${'P95'.padStart(8)} ${'Count'.padStart(6)}`
      );
      console.log(
        '─'.repeat(80)
      );

      for (const stat of report.byEndpoint) {
        const endpoint = `${stat.method} ${stat.endpoint}`.slice(0, 38);
        console.log(
          `${endpoint.padEnd(40)} ${(stat.avgLatency + 'ms').padStart(8)} ${(stat.p90 + 'ms').padStart(8)} ${(stat.p95 + 'ms').padStart(8)} ${String(stat.count).padStart(6)}`
        );
      }
    }

    if (report.slowestRequests.length > 0) {
      console.log(`\n🐢 Slowest Requests:`);
      for (const req of report.slowestRequests.slice(0, 5)) {
        console.log(
          `   ${req.method} ${req.endpoint}: ${req.duration}ms (${req.success ? '✓' : '✗'})`
        );
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

// Singleton instance for global tracking
export const latencyTracker = new LatencyTracker();

// Export class for testing or custom instances
export { LatencyTracker };
