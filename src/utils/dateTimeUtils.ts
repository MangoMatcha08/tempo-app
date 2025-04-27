
// Re-export everything from dateUtils for backward compatibility
export * from './dateUtils';

// Specifically re-export the UTC/local conversion for explicit imports
export {
  convertToUtc,
  convertToLocal
} from './dateUtils/transformation';
