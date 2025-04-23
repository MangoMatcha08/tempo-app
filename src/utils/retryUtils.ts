
/**
 * Retry Utilities
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  backoffFactor?: number;
  retryPredicate?: (error: any) => boolean;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    backoffFactor = 1.5,
    retryPredicate = () => true
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !retryPredicate(error)) {
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(backoffFactor, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
}
