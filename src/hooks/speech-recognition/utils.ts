
/**
 * Utility function to check if app is running as PWA
 */
export const isRunningAsPwa = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches || 
    // Handle navigator.standalone safely for TypeScript
    (typeof navigator !== 'undefined' && 
     'standalone' in navigator && 
     (navigator as any).standalone === true)
  );
};

/**
 * Create a debounced function
 * @param func Function to debounce
 * @param wait Wait time in ms
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function debouncedFunction(this: any, ...args: Parameters<T>): void {
    const context = this;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(context, args);
      timeoutId = null;
    }, wait);
  };
};
