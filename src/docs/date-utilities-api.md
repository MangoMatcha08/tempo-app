
# Date Utilities API Documentation

This document provides detailed information about the date utilities available in our application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Base Transformations](#base-transformations)
3. [Date/Time Operations](#datetime-operations)
4. [Enhanced Utilities](#enhanced-utilities)
5. [Recurring Patterns](#recurring-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)

## Architecture Overview

Our date utilities are organized in a layered architecture:

1. **Base Layer** (`dateTransformations.ts`): Core date parsing, formatting, and comparison functions
2. **DateTime Layer** (`dateTimeUtils.ts`): Time-specific operations and timezone handling
3. **Enhanced Layer** (`enhancedDateUtils.ts`): Application-specific date operations and context-aware formatting
4. **Pattern Layer** (`recurringDatePatterns.ts`): Recurring date generation and pattern handling
5. **Performance Layer** (`dateOperationsCache.ts`): Caching and optimization utilities

The modules are designed to have a clear dependency hierarchy with minimal circular dependencies:

```
dateTransformations.ts  ← Base layer (no dependencies)
     ↑
dateTimeUtils.ts       ← Date/time utilities
     ↑
enhancedDateUtils.ts   ← Enhanced context-aware utilities
     ↑
recurringDatePatterns.ts  ← Pattern utilities
     ↑
dateOperationsCache.ts   ← Performance optimization
```

## Base Transformations

The base layer provides fundamental date operations without app-specific logic.

### parseStringToDate

```typescript
function parseStringToDate(dateStr: string): Date | null
```

Parses various date string formats into a Date object.

**Parameters**:
- `dateStr`: A string representing a date in various formats (ISO, MM/dd/yyyy, etc.)

**Returns**: A Date object if parsing successful, or null if parsing fails.

**Example**:
```typescript
import { parseStringToDate } from '@/utils/dateTransformations';

// Parse an ISO date
const date = parseStringToDate('2023-04-25');

// Parse a formatted date
const date = parseStringToDate('04/25/2023');
```

### formatDate

```typescript
function formatDate(date: Date | string, formatStr?: string): string
```

Formats a Date object to a string using the specified format.

**Parameters**:
- `date`: A Date object or date string
- `formatStr`: (Optional) Format string using date-fns syntax (default: 'yyyy-MM-dd HH:mm')

**Returns**: A formatted date string

**Example**:
```typescript
import { formatDate } from '@/utils/dateTransformations';

// Format a date with default format
const formatted = formatDate(new Date()); // '2023-04-25 14:30'

// Format with custom format
const formatted = formatDate(new Date(), 'MMMM dd, yyyy'); // 'April 25, 2023'
```

### isDateInRange

```typescript
function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean
```

Checks if a date falls within a range.

**Parameters**:
- `date`: The date to check
- `startDate`: The start of the range
- `endDate`: The end of the range

**Returns**: Boolean indicating if the date is within the range (inclusive)

**Example**:
```typescript
import { isDateInRange } from '@/utils/dateTransformations';

const isInRange = isDateInRange(
  new Date('2023-04-15'),
  new Date('2023-04-01'),
  new Date('2023-04-30')
); // true
```

## DateTime Operations

Date and time specific operations with timezone support.

### parseTimeString

```typescript
function parseTimeString(timeStr: string): { hours: number; minutes: number }
```

Parses a time string into hours and minutes.

**Parameters**:
- `timeStr`: A string representing time (e.g., "3:00 PM", "15:00")

**Returns**: An object with hours (0-23) and minutes (0-59)

**Example**:
```typescript
import { parseTimeString } from '@/utils/dateTimeUtils';

const time = parseTimeString('3:00 PM');
// { hours: 15, minutes: 0 }
```

### formatTimeString

```typescript
function formatTimeString(date: Date): string
```

Formats a date into a time string.

**Parameters**:
- `date`: A Date object

**Returns**: A formatted time string (e.g., "3:00 PM")

**Example**:
```typescript
import { formatTimeString } from '@/utils/dateTimeUtils';

const timeStr = formatTimeString(new Date());
// "2:30 PM"
```

### convertToUtc / convertToLocal

```typescript
function convertToUtc(date: Date): Date
function convertToLocal(date: Date): Date
```

Convert dates between UTC and local timezone.

**Parameters**:
- `date`: A Date object

**Returns**: A Date object in the target timezone

**Example**:
```typescript
import { convertToUtc, convertToLocal } from '@/utils/dateTimeUtils';

const utcDate = convertToUtc(new Date());
const localDate = convertToLocal(utcDate);
```

## Enhanced Utilities

Application-specific date utilities with context awareness.

### ensureValidDate

```typescript
function ensureValidDate(date: any): Date
```

Ensures input is converted to a valid Date object with proper timezone.

**Parameters**:
- `date`: Any date-like input (Date, string, Firestore timestamp)

**Returns**: A valid Date object, or current date if input is invalid

**Example**:
```typescript
import { ensureValidDate } from '@/utils/enhancedDateUtils';

const validDate = ensureValidDate('2023-04-25');
const validDate2 = ensureValidDate(firestoreTimestamp);
```

### formatDateWithPeriod

```typescript
function formatDateWithPeriod(date: Date, periodId?: string | null): string
```

Format date with period context.

**Parameters**:
- `date`: A Date object
- `periodId`: Optional period ID

**Returns**: A formatted string with period information if available

**Example**:
```typescript
import { formatDateWithPeriod } from '@/utils/enhancedDateUtils';

const formatted = formatDateWithPeriod(meetingDate, 'period-1');
// "First Period (9:00 AM)"
```

### getRelativeTimeDisplay

```typescript
function getRelativeTimeDisplay(date: Date): string
```

Get a human-readable relative time description.

**Parameters**:
- `date`: A Date object

**Returns**: A string like "2 hours ago" or "in 3 days"

**Example**:
```typescript
import { getRelativeTimeDisplay } from '@/utils/enhancedDateUtils';

const relativeTime = getRelativeTimeDisplay(new Date());
// "2 minutes ago"
```

## Recurring Patterns

Utilities for recurring date patterns.

### generateOccurrences

```typescript
function generateOccurrences(rule: RecurrenceRule, maxOccurrences?: number): Date[]
```

Generate occurrence dates based on a recurrence rule.

**Parameters**:
- `rule`: A RecurrenceRule object defining the pattern
- `maxOccurrences`: Optional maximum number of occurrences to generate

**Returns**: Array of Date objects representing occurrences

**Example**:
```typescript
import { 
  generateOccurrences,
  RecurrenceType 
} from '@/utils/recurringDatePatterns';

const rule = {
  type: RecurrenceType.WEEKLY,
  interval: 1, // Every week
  startDate: new Date('2023-01-01'),
  daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
};

const occurrences = generateOccurrences(rule, 10);
```

## Performance Optimization

Utilities for optimizing date operations performance.

### memoizeDateFn

```typescript
function memoizeDateFn<T>(operation: string, fn: T, expiry?: number): T
```

Create a memoized version of a function that caches its results.

**Parameters**:
- `operation`: A string identifier for the operation
- `fn`: The function to memoize
- `expiry`: Optional cache expiry time in milliseconds

**Returns**: A memoized version of the function

**Example**:
```typescript
import { memoizeDateFn } from '@/utils/dateOperationsCache';

const expensiveDateCalculation = (date: Date) => {
  // Complex calculation...
  return result;
};

const memoized = memoizeDateFn(
  'expensiveCalculation',
  expensiveDateCalculation,
  60 * 1000 // 1 minute cache
);

// First call calculates, subsequent calls use cache
const result1 = memoized(date1);
const result2 = memoized(date1); // Returns cached result
```

## Best Practices

### Timezone Handling

When working with dates across timezones:

1. **Always use `ensureValidDate`** when handling user input or dates from external sources
2. **Use `convertToUtc` before storing** dates in the database
3. **Use `convertToLocal` after retrieving** dates from external sources
4. **Use `formatWithTimezone` for display** to ensure consistent formatting with timezone awareness

### Performance Considerations

1. **Use `memoizeDateFn` for expensive operations** that are called frequently with the same parameters
2. **Batch process dates** when working with large collections:

```typescript
import { batchProcessDates } from '@/utils/dateOperationsCache';

// Process 100 dates efficiently
const results = batchProcessDates(dateArray, formatDate);
```

3. **Set appropriate cache expiry** times based on volatility of data

### API Usage Hierarchy

Follow this hierarchy for importing date utilities:

1. Use `dateUtils.ts` for most imports (preferred entry point)
2. Import directly from specific modules when only a few functions are needed
3. Avoid importing from multiple date utility files in the same module

## Migration Guide

### Migrating from Legacy Date Handling

1. Replace direct `new Date()` parsing with `parseStringToDate`
2. Replace manual formatting with `formatDate` or `formatWithTimezone`
3. Use `ensureValidDate` for input validation instead of manual checks

### Upgrading to date-fns v3/date-fns-tz v3

1. Replace `utcToZonedTime` with `toZonedTime`
2. Replace `zonedTimeToUtc` with `fromZonedTime`
3. Use named exports for all date-fns-tz functions
