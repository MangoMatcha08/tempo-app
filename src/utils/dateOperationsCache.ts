import { isEqual } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';

/**
 * Cache item with result and expiration time
 */
interface CacheItem<T> {
  result: T;
  expiry: number;
}

/**
 * Cache for date operations to improve performance
 * Especially useful for expensive operations like recurring pattern generation
 */
export class DateOperationsCache {
  private static instance: DateOperationsCache;
  private cache: Map<string, CacheItem<any>>;
  private defaultExpiry: number; // milliseconds
  
  private constructor() {
    this.cache = new Map();
    this.defaultExpiry = 5 * 60 * 1000; // 5 minutes by default
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DateOperationsCache {
    if (!DateOperationsCache.instance) {
      DateOperationsCache.instance = new DateOperationsCache();
    }
    return DateOperationsCache.instance;
  }
  
  /**
   * Set cache expiry time
   */
  public setDefaultExpiry(milliseconds: number): void {
    this.defaultExpiry = milliseconds;
  }
  
  /**
   * Clear all cached items
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Generate a cache key from arguments
   */
  private generateKey(operation: string, args: any[]): string {
    const normalizedArgs = args.map(arg => {
      if (arg instanceof Date) {
        return arg.toISOString();
      }
      
      if (arg && typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      
      return String(arg);
    });
    
    return `${operation}:${normalizedArgs.join('|')}`;
  }
  
  /**
   * Memoize a date operation function
   * @returns A memoized version of the function with the same signature
   */
  public memoize<T extends (...args: any[]) => any>(
    operation: string,
    fn: T,
    expiry: number = this.defaultExpiry
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = this.generateKey(operation, args);
      const now = Date.now();
      
      // Check if we have a valid cached result
      const cached = this.cache.get(key);
      if (cached && cached.expiry > now) {
        return cached.result;
      }
      
      // Calculate and cache the result
      const result = fn(...args);
      this.cache.set(key, { 
        result, 
        expiry: now + expiry 
      });
      
      return result;
    }) as T;
  }
  
  /**
   * Get a cached result or compute if not available
   */
  public getOrCompute<T>(
    operation: string,
    args: any[],
    computeFn: (...args: any[]) => T,
    expiry: number = this.defaultExpiry
  ): T {
    const key = this.generateKey(operation, args);
    const now = Date.now();
    
    const cached = this.cache.get(key);
    if (cached && cached.expiry > now) {
      return cached.result;
    }
    
    const result = computeFn(...args);
    this.cache.set(key, { 
      result, 
      expiry: now + expiry 
    });
    
    return result;
  }
  
  /**
   * Invalidate cache entries matching a prefix
   */
  public invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Invalidate all cache entries related to a specific date
   */
  public invalidateForDate(date: Date | string): void {
    const targetDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    
    for (const key of this.cache.keys()) {
      if (key.includes(targetDate)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Check cache size and clean up if needed
   */
  public cleanupIfNeeded(maxSize: number = 100): void {
    if (this.cache.size <= maxSize) return;
    
    // Sort entries by expiry and keep only the newest
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => b[1].expiry - a[1].expiry)
      .slice(0, maxSize);
    
    this.cache.clear();
    entries.forEach(([key, value]) => {
      this.cache.set(key, value);
    });
  }
}

// Export singleton instance
export const dateCache = DateOperationsCache.getInstance();

/**
 * Create a memoized version of a date function
 */
export function memoizeDateFn<T extends (...args: any[]) => any>(
  operation: string,
  fn: T,
  expiry?: number
): T {
  return dateCache.memoize(operation, fn, expiry);
}

/**
 * Batch process dates for better performance
 */
export function batchProcessDates<T>(
  dates: (Date | string)[],
  processFn: (date: Date) => T
): T[] {
  // Pre-process all dates for validation
  const validDates = dates.map(d => ensureValidDate(d));
  
  // Sort the dates to optimize cache locality
  validDates.sort((a, b) => a.getTime() - b.getTime());
  
  // Process in batches
  const results: T[] = [];
  const batchSize = 20; // Process 20 dates at a time
  
  for (let i = 0; i < validDates.length; i += batchSize) {
    const batch = validDates.slice(i, i + batchSize);
    const batchResults = batch.map(date => {
      return dateCache.getOrCompute(
        'batchProcess',
        [date.toISOString(), processFn.toString()],
        () => processFn(date)
      );
    });
    
    results.push(...batchResults);
  }
  
  return results;
}
