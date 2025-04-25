
import { Timestamp } from "firebase/firestore";

export function convertTimestampFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  
  // Convert any Timestamp fields to Date
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object' && 'toDate' in result[key]) {
      result[key] = result[key].toDate();
    }
  }
  
  return result;
}
