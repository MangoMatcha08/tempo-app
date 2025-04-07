
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ReminderPriority } from "./types";
import { addMinutes, isPast, isFuture } from "date-fns";

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Firestore reference
const db = admin.firestore();

/**
 * Scheduled function that runs every 15 minutes to check for upcoming reminders
 * and send notifications to users.
 */
export const checkUpcomingReminders = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async (context) => {
    console.log("Starting to check for upcoming reminders...");
    
    try {
      // Current time
      const now = admin.firestore.Timestamp.now();
      
      // Check for reminders due within the next 30 minutes
      const thirtyMinutesFromNow = admin.firestore.Timestamp.fromDate(
        addMinutes(now.toDate(), 30)
      );
      
      // Query for upcoming reminders
      const remindersSnapshot = await db
        .collection("reminders")
        .where("dueDate", ">=", now)
        .where("dueDate", "<=", thirtyMinutesFromNow)
        .where("completed", "==", false)
        .get();
      
      console.log(`Found ${remindersSnapshot.size} upcoming reminders`);
      
      // Process each reminder
      const notificationPromises = remindersSnapshot.docs.map(async (doc) => {
        const reminder = doc.data();
        return processReminder(reminder, doc.id);
      });
      
      await Promise.all(notificationPromises);
      
      console.log("Finished checking upcoming reminders");
      return null;
    } catch (error) {
      console.error("Error checking upcoming reminders:", error);
      return null;
    }
  });

/**
 * Process a single reminder and send notifications if needed
 */
async function processReminder(reminder: any, reminderId: string) {
  const { userId, title, description, priority, dueDate } = reminder;
  
  if (!userId) {
    console.log(`Reminder ${reminderId} has no userId, skipping notification`);
    return;
  }
  
  try {
    // Get user document
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found, skipping notification`);
      return;
    }
    
    const userData = userDoc.data();
    if (!userData) return;
    
    // Check if notifications are enabled for the user
    const notificationSettings = userData.notificationSettings || {
      enabled: false,
      push: { enabled: false }
    };
    
    if (!notificationSettings.enabled || !notificationSettings.push.enabled) {
      console.log(`Push notifications disabled for user ${userId}`);
      return;
    }
    
    // Check if the reminder meets minimum priority
    if (!shouldSendNotification(priority, notificationSettings)) {
      console.log(
        `Reminder ${reminderId} has priority ${priority} which doesn't meet user's minimum threshold`
      );
      return;
    }
    
    // Get FCM tokens
    const tokens = userData.fcmTokens ? Object.keys(userData.fcmTokens) : [];
    
    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }
    
    // Send notification to all user's devices
    await sendPushNotification(tokens, title, description, reminderId, priority);
    
    console.log(`Notification sent for reminder ${reminderId} to user ${userId}`);
  } catch (error) {
    console.error(`Error processing reminder ${reminderId}:`, error);
  }
}

/**
 * Check if notification should be sent based on priority and user settings
 */
function shouldSendNotification(
  priority: string,
  settings: any
): boolean {
  if (!settings.enabled || !settings.push.enabled) return false;
  
  const priorityValues: Record<string, number> = {
    "low": 1,
    "medium": 2,
    "high": 3
  };
  
  const reminderPriorityValue = priorityValues[priority] || 2;
  const minPriorityValue = priorityValues[settings.push.minPriority] || 1;
  
  return reminderPriorityValue >= minPriorityValue;
}

/**
 * Send push notification to user devices
 */
async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  reminderId: string,
  priority: string
): Promise<void> {
  // Create notification message
  const message = {
    notification: {
      title,
      body
    },
    data: {
      reminderId,
      priority,
      clickAction: "OPEN_REMINDER_DETAIL"
    },
    tokens
  };
  
  try {
    // Send message using FCM
    const response = await admin.messaging().sendMulticast(message);
    console.log(
      `Successfully sent message: ${response.successCount} successful, ${response.failureCount} failed`
    );
    
    // If there are failures, clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(tokens[idx]);
        }
      });
      
      await cleanupInvalidTokens(invalidTokens);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Clean up invalid tokens from the user's FCM token collection
 */
async function cleanupInvalidTokens(invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;
  
  console.log(`Cleaning up ${invalidTokens.length} invalid tokens`);
  
  const tokensSnapshot = await db
    .collectionGroup("users")
    .where("fcmTokens", "array-contains-any", invalidTokens)
    .get();
  
  const updates: Promise<any>[] = [];
  
  tokensSnapshot.forEach((doc) => {
    const userData = doc.data();
    const tokens = userData.fcmTokens || {};
    
    let updated = false;
    invalidTokens.forEach((token) => {
      if (tokens[token]) {
        delete tokens[token];
        updated = true;
      }
    });
    
    if (updated) {
      updates.push(doc.ref.update({ fcmTokens: tokens }));
    }
  });
  
  await Promise.all(updates);
  console.log(`Cleaned up invalid tokens`);
}

/**
 * HTTP trigger function to send a test notification to a specific user
 * This can be used from your frontend to test notification setup
 */
export const sendTestNotification = functions.https.onCall(
  async (data, context) => {
    // Ensure authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send test notifications"
      );
    }
    
    const userId = context.auth.uid;
    
    try {
      // Get the user document to retrieve FCM tokens
      const userDoc = await db.collection("users").doc(userId).get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User not found"
        );
      }
      
      const userData = userDoc.data();
      if (!userData || !userData.fcmTokens) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "No FCM tokens found for this user"
        );
      }
      
      const tokens = Object.keys(userData.fcmTokens);
      
      if (tokens.length === 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "No active devices found for this user"
        );
      }
      
      // Send test notification
      await sendPushNotification(
        tokens,
        "Test Notification",
        "This is a test notification from TempoWizard",
        "test-reminder",
        "high"
      );
      
      return { success: true };
    } catch (error) {
      console.error("Error sending test notification:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send test notification"
      );
    }
  }
);

// Additional endpoint to manually trigger notification checks
export const manualCheckReminders = functions.https.onRequest(
  async (req, res) => {
    try {
      await checkUpcomingReminders();
      res.status(200).send("Reminder check triggered successfully");
    } catch (error) {
      console.error("Error during manual reminder check:", error);
      res.status(500).send("Error during reminder check");
    }
  }
);
