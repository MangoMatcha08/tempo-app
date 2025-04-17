import * as functions from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { NotificationTypes } from "./types";
import { addMinutes, addDays } from "date-fns";
import * as nodemailer from "nodemailer";

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Firestore reference
const db = admin.firestore();

/**
 * Scheduled function that runs every 15 minutes to check for upcoming reminders
 * and send notifications to users.
 */
export const checkUpcomingReminders = onSchedule({
  schedule: "every 15 minutes",
  region: "us-central1",
  timeoutSeconds: 540
}, async (event) => {
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
      return processReminder(reminder, doc.id, NotificationTypes.UPCOMING);
    });
    
    await Promise.all(notificationPromises);
    
    console.log("Finished checking upcoming reminders");
    return;
  } catch (error) {
    console.error("Error checking upcoming reminders:", error);
    return;
  }
});

// Helper function that contains the logic without being a Cloud Function
// This is for direct calls from other functions
export async function checkUpcomingRemindersLogic(): Promise<void> {
  console.log("Starting to check for upcoming reminders (direct call)...");
  
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
      return processReminder(reminder, doc.id, NotificationTypes.UPCOMING);
    });
    
    await Promise.all(notificationPromises);
    
    console.log("Finished checking upcoming reminders");
  } catch (error) {
    console.error("Error checking upcoming reminders:", error);
  }
}

/**
 * Scheduled function that runs once a day to send daily summary emails
 */
export const sendDailySummaries = onSchedule({
  schedule: "0 7 * * *", // Run at 7 AM every day
  timeZone: "America/New_York", // Adjust timezone as needed
  region: "us-central1",
  timeoutSeconds: 540
}, async (event) => {
  console.log("Starting to send daily summaries...");
  
  try {
    // Get users who have enabled daily summaries
    const usersSnapshot = await db
      .collection("users")
      .where("notificationSettings.email.dailySummary.enabled", "==", true)
      .where("notificationSettings.email.enabled", "==", true)
      .where("notificationSettings.enabled", "==", true)
      .get();
    
    console.log(`Found ${usersSnapshot.size} users with daily summaries enabled`);
    
    // Process each user
    const summaryPromises = usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      // Check if we should send "before" or "after" summaries
      const timing = userData.notificationSettings?.email?.dailySummary?.timing || "after";
      
      // Get the date range based on timing preference
      const today = admin.firestore.Timestamp.now().toDate();
      let startDate, endDate;
      
      if (timing === "before") {
        // For "before" timing, get reminders due today
        startDate = admin.firestore.Timestamp.fromDate(today);
        endDate = admin.firestore.Timestamp.fromDate(
          new Date(today.setHours(23, 59, 59, 999))
        );
      } else {
        // For "after" timing, get reminders due tomorrow
        const tomorrow = addDays(today, 1);
        startDate = admin.firestore.Timestamp.fromDate(
          new Date(tomorrow.setHours(0, 0, 0, 0))
        );
        endDate = admin.firestore.Timestamp.fromDate(
          new Date(tomorrow.setHours(23, 59, 59, 999))
        );
      }
      
      // Get reminders for the user within the date range
      const remindersSnapshot = await db
        .collection("reminders")
        .where("userId", "==", userId)
        .where("dueDate", ">=", startDate)
        .where("dueDate", "<=", endDate)
        .where("completed", "==", false)
        .get();
      
      if (remindersSnapshot.size > 0) {
        // Process reminders and send summary email
        await sendDailySummaryEmail(userId, remindersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })), timing);
      }
    });
    
    await Promise.all(summaryPromises);
    console.log("Finished sending daily summaries");
    return;
  } catch (error) {
    console.error("Error sending daily summaries:", error);
    return;
  }
});

/**
 * Process a single reminder and send notifications if needed
 */
async function processReminder(reminder: any, reminderId: string, notificationType: NotificationTypes) {
  const { userId, title, description, priority } = reminder;
  
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
      push: { enabled: false },
      email: { enabled: false }
    };
    
    if (!notificationSettings.enabled) {
      console.log(`Notifications disabled for user ${userId}`);
      return;
    }
    
    // Send push notification if applicable
    if (notificationSettings.push.enabled) {
      if (shouldSendNotification(priority, notificationSettings, "push")) {
        await sendPushNotification(userId, title, description, reminderId, priority, notificationType);
      }
    }
    
    // Send email notification if applicable
    if (notificationSettings.email.enabled) {
      if (shouldSendNotification(priority, notificationSettings, "email")) {
        await sendEmailNotification(userId, userData.email, title, description, reminderId, priority, notificationType);
      }
    }
    
    console.log(`Notifications processed for reminder ${reminderId} to user ${userId}`);
  } catch (error) {
    console.error(`Error processing reminder ${reminderId}:`, error);
  }
}

/**
 * Check if notification should be sent based on priority and user settings
 */
function shouldSendNotification(
  priority: string,
  settings: any,
  notificationType: 'email' | 'push' | 'inApp'
): boolean {
  if (!settings.enabled) return false;
  
  const typeSettings = settings[notificationType];
  if (!typeSettings || !typeSettings.enabled) return false;
  
  const priorityValues: Record<string, number> = {
    "low": 1,
    "medium": 2,
    "high": 3
  };
  
  const reminderPriorityValue = priorityValues[priority] || 2;
  const minPriorityValue = priorityValues[typeSettings.minPriority] || 1;
  
  return reminderPriorityValue >= minPriorityValue;
}

/**
 * Send push notification to user devices
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  reminderId: string,
  priority: string,
  notificationType: NotificationTypes
): Promise<void> {
  try {
    // Get user document to retrieve FCM tokens
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found for push notification`);
      return;
    }
    
    const userData = userDoc.data();
    if (!userData || !userData.fcmTokens) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }
    
    const tokens = Object.keys(userData.fcmTokens || {});
    
    if (!tokens || tokens.length === 0) {
      console.log(`No active devices found for user ${userId}`);
      return;
    }
    
    // Create data payload
    const data: Record<string, string> = {
      reminderId,
      priority,
      notificationType,
      clickAction: "OPEN_REMINDER_DETAIL",
      timestamp: Date.now().toString()
    };
    
    // Add special handling based on notification type
    let notificationTitle = title;
    if (notificationType === NotificationTypes.UPCOMING) {
      data.timeUntilDue = "30 minutes";
    } else if (notificationType === NotificationTypes.OVERDUE) {
      notificationTitle = `Overdue: ${title}`;
      data.overdue = "true";
    }
    
    // Create the message
    const messages = tokens.map(token => {
      return {
        token: token,
        notification: {
          title: notificationTitle,
          body: body
        },
        data: data,
        android: {
          notification: {
            icon: 'ic_notification',
            color: getPriorityColor(priority)
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            }
          }
        },
        fcmOptions: {
          analyticsLabel: `reminder_${notificationType}`
        }
      };
    });
    
    // Send messages in batches to avoid payload size limits
    const batchSize = 500;
    const results: (string | FirebaseError)[] = []; // Explicitly type the results array
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(message => 
          admin.messaging().send(message)
            .then(messageId => messageId) // Return message ID on success
            .catch(error => error) // Return error object on failure
        )
      );
      results.push(...batchResults);
    }
    
    console.log(`Successfully sent ${results.length} push notifications`);
    
    // Check for failures and clean up invalid tokens
    const invalidTokens: string[] = [];
    let failureCount = 0;
    
    tokens.forEach((token, idx) => {
      if (idx < results.length) {
        // If there was an error (result is an error object, not a string message ID)
        if (typeof results[idx] !== 'string') {
          invalidTokens.push(token);
          failureCount++;
        }
      }
    });
    
    console.log(`Push notification results: ${results.length - failureCount} successful, ${failureCount} failed`);
    
    if (invalidTokens.length > 0) {
      await cleanupInvalidTokens(invalidTokens);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

// Define a FirebaseError type for clarity
interface FirebaseError {
  code: string;
  message: string;
}

/**
 * Get color for notification based on priority
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#D32F2F'; // Red
    case 'medium':
      return '#FFA000'; // Amber
    default:
      return '#388E3C'; // Green
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  userId: string,
  email: string,
  subject: string,
  body: string,
  reminderId: string,
  priority: string,
  notificationType: NotificationTypes
): Promise<void> {
  try {
    if (!email) {
      console.log(`No email address found for user ${userId}`);
      return;
    }
    
    // Get email configuration from environment variables
    const emailConfig = functions.config().email || {};
    const emailUser = emailConfig.user || process.env.EMAIL_USER;
    const emailPass = emailConfig.password || process.env.EMAIL_PASSWORD;
    const emailService = emailConfig.service || process.env.EMAIL_SERVICE || 'gmail';
    
    if (!emailUser || !emailPass) {
      console.error("Email configuration not set up");
      return;
    }
    
    // Create transport
    const transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    
    // Create email content
    const priorityText = priority.charAt(0).toUpperCase() + priority.slice(1);
    const emailSubject = notificationType === NotificationTypes.OVERDUE 
      ? `Overdue Reminder: ${subject}` 
      : subject;
    
    // Create email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${getPriorityColor(priority)}; padding: 10px; text-align: center;">
          <h1 style="color: white; margin: 0;">${emailSubject}</h1>
          <p style="color: white; margin: 5px 0 0 0;">Priority: ${priorityText}</p>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>${body}</p>
          <p style="margin-top: 20px; font-style: italic;">
            This is a notification from your TempoWizard app.
          </p>
        </div>
      </div>
    `;
    
    // Send email
    const info = await transporter.sendMail({
      from: `"TempoWizard" <${emailUser}>`,
      to: email,
      subject: emailSubject,
      text: `${subject}\n\nPriority: ${priorityText}\n\n${body}\n\nThis is a notification from your TempoWizard app.`,
      html: emailHtml
    });
    
    console.log(`Email notification sent to ${email}`, info.messageId);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}

/**
 * Send daily summary email
 */
async function sendDailySummaryEmail(
  userId: string,
  reminders: any[],
  timing: 'before' | 'after'
): Promise<void> {
  try {
    // Get user document
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found for daily summary`);
      return;
    }
    
    const userData = userDoc.data();
    if (!userData || !userData.email) {
      console.log(`No email address found for user ${userId}`);
      return;
    }
    
    const email = userData.email;
    const userName = userData.displayName || 'User';
    
    // Get email configuration from environment variables
    const emailConfig = functions.config().email || {};
    const emailUser = emailConfig.user || process.env.EMAIL_USER;
    const emailPass = emailConfig.password || process.env.EMAIL_PASSWORD;
    const emailService = emailConfig.service || process.env.EMAIL_SERVICE || 'gmail';
    
    if (!emailUser || !emailPass) {
      console.error("Email configuration not set up");
      return;
    }
    
    // Create transport
    const transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    
    // Create email subject
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const tomorrow = addDays(today, 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const emailSubject = timing === 'before' 
      ? `Daily Reminder Summary for Today (${dateStr})` 
      : `Daily Reminder Summary for Tomorrow (${tomorrowStr})`;
    
    // Group reminders by priority
    const highPriority = reminders.filter(r => r.priority === 'high');
    const mediumPriority = reminders.filter(r => r.priority === 'medium');
    const lowPriority = reminders.filter(r => r.priority === 'low');
    
    // Create email HTML
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3498db; padding: 15px; text-align: center;">
          <h1 style="color: white; margin: 0;">${emailSubject}</h1>
          <p style="color: white; margin: 5px 0 0 0;">Hello ${userName}!</p>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Here's a summary of your upcoming reminders:</p>
    `;
    
    // Add high priority reminders
    if (highPriority.length > 0) {
      emailHtml += `
        <div style="margin-top: 15px;">
          <h2 style="color: #D32F2F; margin-bottom: 10px;">High Priority (${highPriority.length})</h2>
          ${createReminderListHtml(highPriority)}
        </div>
      `;
    }
    
    // Add medium priority reminders
    if (mediumPriority.length > 0) {
      emailHtml += `
        <div style="margin-top: 15px;">
          <h2 style="color: #FFA000; margin-bottom: 10px;">Medium Priority (${mediumPriority.length})</h2>
          ${createReminderListHtml(mediumPriority)}
        </div>
      `;
    }
    
    // Add low priority reminders
    if (lowPriority.length > 0) {
      emailHtml += `
        <div style="margin-top: 15px;">
          <h2 style="color: #388E3C; margin-bottom: 10px;">Low Priority (${lowPriority.length})</h2>
          ${createReminderListHtml(lowPriority)}
        </div>
      `;
    }
    
    // Add footer
    emailHtml += `
          <p style="margin-top: 30px; font-style: italic;">
            This is an automated summary from your TempoWizard app.
          </p>
        </div>
      </div>
    `;
    
    // Create plain text version
    let textContent = `${emailSubject}\n\nHello ${userName}!\n\nHere's a summary of your upcoming reminders:\n\n`;
    
    if (highPriority.length > 0) {
      textContent += `HIGH PRIORITY (${highPriority.length}):\n${createReminderListText(highPriority)}\n\n`;
    }
    
    if (mediumPriority.length > 0) {
      textContent += `MEDIUM PRIORITY (${mediumPriority.length}):\n${createReminderListText(mediumPriority)}\n\n`;
    }
    
    if (lowPriority.length > 0) {
      textContent += `LOW PRIORITY (${lowPriority.length}):\n${createReminderListText(lowPriority)}\n\n`;
    }
    
    textContent += `This is an automated summary from your TempoWizard app.`;
    
    // Send email
    const info = await transporter.sendMail({
      from: `"TempoWizard" <${emailUser}>`,
      to: email,
      subject: emailSubject,
      text: textContent,
      html: emailHtml
    });
    
    console.log(`Daily summary email sent to ${email}`, info.messageId);
  } catch (error) {
    console.error("Error sending daily summary email:", error);
  }
}

/**
 * Create HTML list of reminders
 */
function createReminderListHtml(reminders: any[]): string {
  let html = '<ul style="padding-left: 20px;">';
  
  reminders.forEach(reminder => {
    const dueDate = reminder.dueDate instanceof admin.firestore.Timestamp 
      ? reminder.dueDate.toDate() 
      : new Date(reminder.dueDate);
      
    const timeString = dueDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    html += `
      <li style="margin-bottom: 10px;">
        <div style="font-weight: bold;">${reminder.title}</div>
        <div style="color: #666;">Due at ${timeString}</div>
        ${reminder.description ? `<div style="margin-top: 5px;">${reminder.description}</div>` : ''}
      </li>
    `;
  });
  
  html += '</ul>';
  return html;
}

/**
 * Create text list of reminders
 */
function createReminderListText(reminders: any[]): string {
  let text = '';
  
  reminders.forEach(reminder => {
    const dueDate = reminder.dueDate instanceof admin.firestore.Timestamp 
      ? reminder.dueDate.toDate() 
      : new Date(reminder.dueDate);
      
    const timeString = dueDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    text += `- ${reminder.title} (Due at ${timeString})`;
    if (reminder.description) {
      text += `\n  ${reminder.description}`;
    }
    text += '\n';
  });
  
  return text;
}

/**
 * Clean up invalid tokens from the user's FCM token collection
 */
async function cleanupInvalidTokens(invalidTokens: string[]): Promise<void> {
  if (!invalidTokens || invalidTokens.length === 0) {
    console.log("No invalid tokens to clean up");
    return;
  }
  
  console.log(`Cleaning up ${invalidTokens.length} invalid tokens`);
  
  try {
    const tokensSnapshot = await db
      .collectionGroup("users")
      .where("fcmTokens", "array-contains-any", invalidTokens)
      .get();
    
    const updates: Promise<any>[] = [];
    
    tokensSnapshot.forEach((doc) => {
      const userData = doc.data();
      const fcmTokens = userData.fcmTokens || {};
      
      let updated = false;
      invalidTokens.forEach((token) => {
        if (fcmTokens[token]) {
          delete fcmTokens[token];
          updated = true;
        }
      });
      
      if (updated) {
        updates.push(doc.ref.update({ fcmTokens: fcmTokens }));
      }
    });
    
    await Promise.all(updates);
    console.log(`Cleaned up invalid tokens`);
  } catch (error) {
    console.error("Error cleaning up invalid tokens:", error);
  }
}

/**
 * Check for overdue reminders and send notifications
 */
export const checkOverdueReminders = onSchedule({
  schedule: "every 2 hours",
  region: "us-central1",
  timeoutSeconds: 540
}, async (event) => {
  console.log("Starting to check for overdue reminders...");
  
  try {
    // Current time
    const now = admin.firestore.Timestamp.now();
    
    // Start time for overdue (2 hours ago)
    const twoHoursAgo = admin.firestore.Timestamp.fromDate(
      addMinutes(now.toDate(), -120)
    );
    
    // Query for reminders that are overdue but haven't been notified yet
    const remindersSnapshot = await db
      .collection("reminders")
      .where("dueDate", ">=", twoHoursAgo)
      .where("dueDate", "<=", now)
      .where("completed", "==", false)
      .where("overdueNotified", "==", false)
      .get();
    
    console.log(`Found ${remindersSnapshot.size} overdue reminders`);
    
    // Process each overdue reminder
    const overduePromises = remindersSnapshot.docs.map(async (doc) => {
      const reminder = doc.data();
      
      // Mark as notified
      await doc.ref.update({ overdueNotified: true });
      
      // Process the reminder
      return processReminder(reminder, doc.id, NotificationTypes.OVERDUE);
    });
    
    await Promise.all(overduePromises);
    
    console.log("Finished checking overdue reminders");
    return;
  } catch (error) {
    console.error("Error checking overdue reminders:", error);
    return;
  }
});

/**
 * HTTP trigger function to send a test notification to a specific user
 * This can be used from your frontend to test notification setup
 */
export const sendTestNotification = onCall({
  region: "us-central1" 
}, async (request) => {
  // Ensure authentication
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to send test notifications"
    );
  }
  
  const userId = request.auth.uid;
  const data = request.data as any;
  const notificationType = data?.type || 'push';
  
  try {
    // Get the user document
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      throw new HttpsError(
        "not-found",
        "User not found"
      );
    }
    
    const userData = userDoc.data();
    if (!userData) {
      throw new HttpsError(
        "internal",
        "User data not found"
      );
    }
    
    // Handle push notification test
    if (notificationType === 'push') {
      if (!userData.fcmTokens || Object.keys(userData.fcmTokens).length === 0) {
        throw new HttpsError(
          "failed-precondition",
          "No FCM tokens found for this user"
        );
      }
      
      // Send test push notification
      await sendPushNotification(
        userId,
        "Test Notification",
        "This is a test notification from TempoWizard",
        "test-reminder",
        "high",
        NotificationTypes.TEST
      );
    }
    
    // Handle email notification test
    if (notificationType === 'email') {
      if (!userData.email) {
        throw new HttpsError(
          "failed-precondition",
          "No email address found for this user"
        );
      }
      
      // Send test email
      await sendEmailNotification(
        userId,
        userData.email,
        "Test Email Notification",
        "This is a test email notification from TempoWizard.",
        "test-reminder",
        "high",
        NotificationTypes.TEST
      );
    }
    
    return { success: true, type: notificationType };
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw new HttpsError(
      "internal",
      "Failed to send test notification"
    );
  }
});

/**
 * HTTP function to handle notification actions
 * This function will be called by the service worker when users interact with notification actions
 */
export const handleNotificationAction = onCall({
  region: "us-central1"
}, async (request) => {
  // Validate request data
  const data = request.data as any;
  
  if (!data || !data.action || !data.reminderId) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: action and reminderId"
    );
  }

  const action = data.action;
  const reminderId = data.reminderId;
  const userId = data.userId;
  const snoozeMinutes = data.snoozeMinutes;
  
  console.log(`Processing ${action} for reminder ${reminderId}`);
  
  try {
    // Get the reminder document
    const reminderRef = db.collection("reminders").doc(reminderId);
    const reminderDoc = await reminderRef.get();
    
    if (!reminderDoc.exists) {
      throw new HttpsError(
        "not-found",
        `Reminder ${reminderId} not found`
      );
    }
    
    const reminder = reminderDoc.data();
    
    // Verify the user has permission to modify this reminder
    if (userId !== reminder?.userId && request.auth?.uid !== reminder?.userId) {
      throw new HttpsError(
        "permission-denied",
        "You don't have permission to modify this reminder"
      );
    }
    
    // Process the action
    switch (action) {
      case 'complete':
        // Mark reminder as completed
        await reminderRef.update({
          completed: true,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Reminder ${reminderId} marked as completed`);
        return { success: true, message: "Reminder completed" };
        
      case 'snooze':
        // Calculate new due date
        const minutes = snoozeMinutes || 30;
        const newDueDate = admin.firestore.Timestamp.fromDate(
          addMinutes(new Date(), minutes)
        );
        
        // Update the reminder with new due date
        await reminderRef.update({
          dueDate: newDueDate,
          overdueNotified: false // Reset overdue notification flag
        });
        console.log(`Reminder ${reminderId} snoozed for ${minutes} minutes`);
        return { success: true, message: `Reminder snoozed for ${minutes} minutes` };
        
      default:
        throw new HttpsError(
          "invalid-argument",
          `Unknown action: ${action}`
        );
    }
  } catch (error) {
    console.error(`Error processing ${action} for reminder ${reminderId}:`, error);
    throw new HttpsError(
      "internal",
      "Failed to process notification action"
    );
  }
});

// Additional endpoint to manually trigger notification checks
export const manualCheckReminders = onRequest({
  region: "us-central1"
}, async (req, res) => {
  try {
    // Directly call the logic function
    await checkUpcomingRemindersLogic();
    
    res.status(200).send("Reminder check triggered successfully");
  } catch (error) {
    console.error("Error during manual reminder check:", error);
    res.status(500).send("Error during reminder check");
  }
});