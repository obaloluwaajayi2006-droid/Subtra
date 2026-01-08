# Firebase Cloud Functions - Subscription Email Reminders

This directory contains Cloud Functions that send email reminders 7 days before subscriptions renew.

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project set up

### 2. Install Dependencies
```bash
cd functions
npm install
```

### 3. Configure Email (Gmail)

The function uses Gmail with App Passwords for security:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to https://myaccount.google.com/security

2. **Create an App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password

3. **Set Firebase Environment Variables**
   ```bash
   firebase functions:config:set gmail.user="your-email@gmail.com"
   firebase functions:config:set gmail.password="your-16-char-app-password"
   ```

4. **Verify Configuration**
   ```bash
   firebase functions:config:get
   ```

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

### 5. Monitor Logs

```bash
firebase functions:log
```

Or view in Firebase Console:
- Go to https://console.firebase.google.com
- Select your project
- Go to Functions
- Click "Logs" tab

## How It Works

**Function:** `checkExpiringSubscriptions`
- **Trigger:** Runs daily at 9:00 AM UTC
- **What it does:**
  1. Checks all users in Firestore
  2. Looks for subscriptions renewing in the next 7 days
  3. Calculates renewal dates based on billing cycle (weekly, monthly, quarterly, yearly)
  4. Sends a reminder email with:
     - List of renewing subscriptions
     - Renewal dates and amounts
     - Link to manage subscriptions

## Email Requirements in Firestore

Make sure each subscription has:
- `name` - Subscription name (e.g., "Netflix")
- `amount` - Subscription cost
- `currency` - Currency code (e.g., "USD")
- `billingCycle` - One of: "weekly", "monthly", "quarterly", "yearly"
- `startDate` - Firestore Timestamp of when subscription started

User documents must have:
- `email` - User's email address
- `displayName` - User's name (optional, falls back to email)

## Testing

To test locally:
```bash
firebase emulators:start --only functions
```

To manually trigger the function:
```bash
firebase functions:call checkExpiringSubscriptions
```

## Cost Notes

- Firebase Cloud Functions: Free tier includes 2M invocations/month
- This function runs once per day, so ~30 invocations/month (well within free tier)
- Email sending via Gmail: Free (using your personal Gmail account)

## Troubleshooting

**Emails not sending:**
- Check Firebase Functions logs
- Verify email credentials are correct
- Check Gmail settings - may need to allow "Less secure app access" or use App Password

**Function not running:**
- Verify it's deployed: `firebase deploy --only functions`
- Check Firebase Console > Functions > Logs
- Ensure Cloud Scheduler is enabled in Firebase project

**Wrong renewal dates:**
- Check `billingCycle` values match: "weekly", "monthly", "quarterly", "yearly"
- Verify `startDate` is correctly stored as Firestore Timestamp
