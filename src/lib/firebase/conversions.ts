
import { isTimestamp } from "@/utils/typeGuards";

export function convertTimestampFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  
  // Convert any Timestamp fields to Date
  for (const key in result) {
    if (isTimestamp(result[key])) {
      result[key] = result[key].toDate();
    }
  }
  
  return result;
}
