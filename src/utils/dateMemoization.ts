
type MemoizedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): ReturnType<T>;
  cache: Map<string, { value: ReturnType<T>; timestamp: number }>;
  clearCache: () => void;
};

export function memoizeDateFn<T extends (...args: any[]) => any>(
  key: string,
  fn: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes default TTL
): MemoizedFunction<T> {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    const cacheKey = `${key}-${JSON.stringify(args)}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(cacheKey, { value: result, timestamp: now });
    return result;
  };

  memoized.cache = cache;
  memoized.clearCache = () => cache.clear();

  return memoized as MemoizedFunction<T>;
}

