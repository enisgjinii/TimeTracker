# Firebase Configuration Guide

This guide explains how to configure Firebase for the TimeTracker application. The system supports two methods of Firebase configuration.

## Method 1: Service Account Key File (Recommended)

### Step 1: Download Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`timetracker-7da41`)
3. Click on **Project Settings** (gear icon)
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file and rename it to `serviceAccountKey.json`
7. Place it in the root directory of your project

### Step 2: Configure Database URL
The service account key method automatically uses your project's database URL:
```
https://timetracker-7da41-default-rtdb.europe-west1.firebasedatabase.app
```

### Step 3: Test Configuration
Start your server and verify Firebase initialization:
```bash
node server.js
```

You should see: `✅ Firebase initialized with service account key file`

## Method 2: Environment Variables (Fallback)

If the service account key file is not found, the system will fallback to environment variables.

### Step 1: Get Firebase Credentials
From the downloaded service account key file, extract these values:

### Step 2: Update .env File
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=timetracker-7da41
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@timetracker-7da41.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important:** Replace the placeholder values with actual credentials from your service account key file.

## Configuration Priority

The system checks for Firebase credentials in this order:
1. **Service Account Key File** (`serviceAccountKey.json`)
2. **Environment Variables** (`.env` file)
3. **Graceful Fallback** (503 Service Unavailable responses)

## Security Notes

1. **Never commit** `serviceAccountKey.json` to version control
2. **Never commit** `.env` files with real credentials
3. The `.gitignore` file already excludes these sensitive files
4. Use `serviceAccountKey.json.template` as a reference for the file structure

## Verification

### Test Firebase Connection
```bash
curl "http://localhost:3001/api/verify-subscription?firebaseUid=test"
```

**Expected Responses:**
- **With valid Firebase config:** User-specific subscription data or "User not found"
- **Without Firebase config:** `{"error":"Firebase service unavailable"}`

### Test Other Endpoints
```bash
# Test subscription plans (doesn't require Firebase)
curl http://localhost:3001/api/subscription-plans

# Test health check
curl http://localhost:3001/health
```

## Production Deployment

### Vercel Deployment
When deploying to Vercel, set these environment variables in your Vercel dashboard:

```env
FIREBASE_PROJECT_ID=timetracker-7da41
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@timetracker-7da41.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### Service Account Key in Production
For production, it's recommended to use environment variables rather than uploading the service account key file.

## Troubleshooting

### Firebase Initialization Failed
- Check that your service account key file is valid JSON
- Verify the private key format (should include `\n` characters)
- Ensure the project ID matches your Firebase project

### 503 Service Unavailable
- This is expected when Firebase credentials are not configured
- The application will continue to work for non-Firebase features
- Payment plans and health checks will still function

### Permission Denied
- Verify your service account has the correct permissions
- Ensure Firestore is enabled in your Firebase project
- Check that the service account has Firestore read/write permissions

## Example Service Account Key Structure

See `serviceAccountKey.json.template` for the expected file structure.

## API Endpoints That Require Firebase

- `/api/verify-subscription` - Requires Firebase
- `/api/subscription-details` - Requires Firebase  
- `/api/create-portal-session` - Requires Firebase
- `/api/cancel-subscription` - Requires Firebase
- `/api/stripe-webhook` - Requires Firebase

## API Endpoints That Don't Require Firebase

- `/api/subscription-plans` - Works without Firebase
- `/health` - Always available
- `/api/create-checkout-session` - Works without Firebase (for new subscriptions) 