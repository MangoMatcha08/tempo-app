
/**
 * DatePerformanceMonitor for tracking and measuring date operations
 */
class DatePerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private enabled: boolean = false;

  enable(value: boolean = true): void {
    this.enabled = value;
  }

  measureParse(fn: () => any, context: Record<string, any> = {}): any {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordMeasurement('parse', duration);
    
    if (this.enabled) {
      console.log('Parse operation:', { duration, context });
    }

    return result;
  }

  measureFormat(fn: () => any, context: Record<string, any> = {}): any {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordMeasurement('format', duration);
    
    if (this.enabled) {
      console.log('Format operation:', { duration, context });
    }

    return result;
  }

  measureGeneration(fn: () => any, context: Record<string, any> = {}): any {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordMeasurement('generation', duration);
    
    if (this.enabled) {
      console.log('Generation operation:', { duration, context });
    }

    return result;
  }

  private recordMeasurement(type: string, duration: number): void {
    if (!this.measurements.has(type)) {
      this.measurements.set(type, []);
    }
    this.measurements.get(type)?.push(duration);
  }

  generateReport(): Record<string, any> {
    const report: Record<string, any> = {};

    for (const [type, durations] of this.measurements.entries()) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);

      report[type] = {
        average: avg.toFixed(2),
        max: max.toFixed(2),
        min: min.toFixed(2),
        count: durations.length
      };
    }

    return report;
  }

  reset(): void {
    this.measurements.clear();
  }
}

// Singleton instance
export const datePerformance = new DatePerformanceMonitor();
