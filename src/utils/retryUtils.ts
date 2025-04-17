
/**
 * Generic retry utility with logging support
 */

export interface RetryLogger {
  logEvent?: (event: string, data?: any) => void;
  logError?: (event: string, error: any, data?: any) => void;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  backoffFactor?: number;
  retryPredicate?: (error: any, attempt: number) => boolean;
  logger?: RetryLogger;
}

// Utility function for sleeping
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Timeout utility
export const timeout = <T>(
  promise: Promise<T>, 
  ms: number, 
  errorMessage?: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage || `Operation timed out after ${ms}ms`)), ms);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> => {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const backoffFactor = options?.backoffFactor ?? 1.5;
  const logger = options?.logger || {
    logEvent: () => {},
    logError: () => {}
  };
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = baseDelayMs * Math.pow(backoffFactor, attempt - 1);
        logger.logEvent?.('retry-attempt', {
          attempt,
          delayMs,
          maxRetries
        });
        await sleep(delayMs);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      const shouldRetry = options?.retryPredicate 
        ? options.retryPredicate(error, attempt)
        : true;
      
      if (!shouldRetry) {
        logger.logEvent?.('retry-aborted', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
          reason: 'retry-predicate-false'
        });
        break;
      }
      
      logger.logError?.('retry-error', error, {
        attempt,
        nextAttemptDelay: baseDelayMs * Math.pow(backoffFactor, attempt),
        remainingRetries: maxRetries - attempt
      });
    }
  }
  
  logger.logError?.('retry-exhausted', lastError, {
    totalAttempts: maxRetries + 1
  });
  
  throw lastError;
};
