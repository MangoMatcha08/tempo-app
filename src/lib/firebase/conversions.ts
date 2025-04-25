
import { Timestamp } from "firebase/firestore";

export function convertTimestampFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  
  // Convert any Timestamp fields to Date
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  }
  
  return result;
}
