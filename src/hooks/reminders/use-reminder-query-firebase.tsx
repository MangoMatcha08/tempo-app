
import { useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer
} from "firebase/firestore";
import { DatabaseReminder } from "@/types/reminderTypes";
import { transformReminder } from "./reminder-transformations";
import { getMockReminders } from "./mock-reminders";
import { useToast } from "@/hooks/use-toast";
import { isMissingIndexError } from "@/lib/firebase/indexing";

export function useReminderQueryFirebase(user: any, db: any, useMockData: boolean = false) {
  const { toast } = useToast();

  const fetchFromFirebase = useCallback(async (isBackgroundFetch = false) => {
    if (!user?.uid || !db) {
      return [];
    }

    try {
      console.log("Fetching reminders for user:", user.uid);

      if (useMockData) {
        const mockData = getMockReminders(user.uid);
        return mockData;
      }

      // Get total count first
      try {
        const countQuery = query(
          collection(db, "reminders"),
          where("userId", "==", user.uid)
        );
        const countSnapshot = await getCountFromServer(countQuery);
        console.log("Total reminders:", countSnapshot.data().count);
        return countSnapshot.data().count;
      } catch (countError) {
        console.warn("Could not get count", countError);
      }

      let fetchedReminders: DatabaseReminder[] = [];
      
      try {
        console.log("Trying query with composite index");
        const indexQuery = query(
          collection(db, "reminders"),
          where("userId", "==", user.uid),
          orderBy("dueDate", "asc"),
          orderBy("priority", "desc"),
          limit(50)
        );
        
        const querySnapshot = await getDocs(indexQuery);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const reminder = transformReminder(doc.id, data);
          fetchedReminders.push(reminder);
        });
        
      } catch (indexError) {
        if (isMissingIndexError(indexError)) {
          console.log("Composite index not ready, using simplified query");
          
          toast({
            title: "Missing Firestore Index",
            description: "A database index is needed for optimal performance. Click 'Create Index' to fix.",
            variant: "destructive",
            action: {
              altText: "Create Index",
              onClick: () => console.log("Create Index clicked")
            }
          });
          
          // Use a simpler query as fallback
          const simpleQuery = query(
            collection(db, "reminders"),
            where("userId", "==", user.uid),
            orderBy("dueDate", "asc"),
            limit(50)
          );
          
          const fallbackSnapshot = await getDocs(simpleQuery);
          
          fetchedReminders = [];
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data();
            const reminder = transformReminder(doc.id, data);
            fetchedReminders.push(reminder);
          });
        } else {
          throw indexError;
        }
      }

      return fetchedReminders;
    } catch (e) {
      console.error("Error fetching reminders from Firebase:", e);
      throw e;
    }
  }, [user?.uid, db, useMockData, toast]);

  return {
    fetchFromFirebase
  };
}
