import React from 'react';
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
import { ensureValidDate } from "./reminder-formatting";
import { getMockReminders } from "./mock-reminders";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { isMissingIndexError, getFirestoreIndexCreationUrl } from "@/lib/firebase/indexing";
import { convertTimestampFields } from "@/lib/firebase/firestore";
import { toPSTTime } from "@/utils/dateTimeUtils";

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

      let totalCount = 0;
      try {
        const countQuery = query(
          collection(db, "reminders"),
          where("userId", "==", user.uid)
        );
        const countSnapshot = await getCountFromServer(countQuery);
        totalCount = countSnapshot.data().count;
        console.log("Total reminders:", totalCount);
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
        
        // Transform data to be cloneable
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          try {
            // Use convertTimestampFields to handle Firestore timestamps correctly
            const convertedData = convertTimestampFields(data);
            
            // Process and validate dates to ensure PST timezone consistency
            const parsedData = {
              ...convertedData,
              dueDate: convertedData.dueDate ? toPSTTime(ensureValidDate(convertedData.dueDate)) : toPSTTime(new Date()),
              createdAt: convertedData.createdAt ? toPSTTime(ensureValidDate(convertedData.createdAt)) : toPSTTime(new Date()),
              completedAt: convertedData.completedAt ? toPSTTime(ensureValidDate(convertedData.completedAt)) : null
            };
            
            // Transform the document into a reminder object
            const reminder = transformReminder(doc.id, parsedData);
            fetchedReminders.push(reminder);
            
          } catch (transformError) {
            console.error("Error transforming reminder:", transformError, data);
          }
        });
        
      } catch (indexError) {
        if (isMissingIndexError(indexError)) {
          console.log("Composite index not ready, using simplified query");
          
          // Generate index creation URL for the specific fields needed
          const indexFields = ['userId', 'dueDate', 'priority'];
          const indexUrl = getFirestoreIndexCreationUrl('reminders', indexFields);
          
          toast({
            title: "Missing Firestore Index",
            description: "A database index is needed for optimal performance. Click 'Create Index' to fix.",
            variant: "destructive",
            action: (
              <ToastAction altText="Create Index" onClick={() => {
                if (indexUrl) {
                  window.open(indexUrl, '_blank');
                }
              }}>
                Create Index
              </ToastAction>
            )
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
            try {
              // Use convertTimestampFields to handle Firestore timestamps correctly
              const convertedData = convertTimestampFields(data);
              
              // Process and validate dates to ensure PST timezone consistency
              const parsedData = {
                ...convertedData,
                dueDate: convertedData.dueDate ? toPSTTime(ensureValidDate(convertedData.dueDate)) : toPSTTime(new Date()),
                createdAt: convertedData.createdAt ? toPSTTime(ensureValidDate(convertedData.createdAt)) : toPSTTime(new Date()),
                completedAt: convertedData.completedAt ? toPSTTime(ensureValidDate(convertedData.completedAt)) : null
              };
              
              // Transform the document into a reminder object
              const reminder = transformReminder(doc.id, parsedData);
              fetchedReminders.push(reminder);
            } catch (transformError) {
              console.error("Error transforming reminder (fallback):", transformError, data);
            }
          });
        } else {
          throw indexError;
        }
      }

      console.log("Fetched reminders:", fetchedReminders.length);
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
