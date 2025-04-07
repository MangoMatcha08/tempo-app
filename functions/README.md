
# TempoWizard Firebase Functions

This directory contains Firebase Functions for the TempoWizard application. These functions handle:

1. **Scheduled reminder checks** - Every 15 minutes, checks for upcoming reminders and sends notifications
2. **Test notifications** - Callable function to send test notifications to users
3. **Manual reminder checks** - HTTP endpoint to manually trigger the notification system

## Deployment

To deploy these functions:

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Deploy to Firebase
npm run deploy
```

## Local Development

To run the functions locally:

```bash
# Install dependencies
npm install

# Start the Firebase emulator
npm run serve
```

## Function Details

### checkUpcomingReminders

Scheduled function that runs every 15 minutes to check for upcoming reminders and send notifications.

### sendTestNotification

Callable function to send a test notification to the authenticated user.

### manualCheckReminders

HTTP endpoint to manually trigger the reminder check process.
