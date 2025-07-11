# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your TimeTracker application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "timetracker-pro")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle the "Enable" switch
   - Click "Save"

## Step 3: Create a Web App

1. In the Firebase console, click on the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`)
5. Enter an app nickname (e.g., "TimeTracker Web App")
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 4: Configure Your App

1. Open `js/firebase-config.js` in your project
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};
```

## Step 5: Enable Firestore (Optional but Recommended)

If you want to store user profiles and settings:

1. In the Firebase console, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## Step 6: Security Rules (Important)

For Firestore, set up basic security rules:

1. In Firestore, go to the "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 7: Test the Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm start
   ```

3. You should see the login/signup screen when the app starts
4. Try creating a new account and signing in

## Features Included

### Authentication Features:
- ✅ Email/Password sign up and sign in
- ✅ Password reset functionality
- ✅ User profile creation in Firestore
- ✅ Automatic session management
- ✅ User menu with logout option
- ✅ Protected routes (app only accessible when authenticated)

### UI Features:
- ✅ Modern, responsive authentication forms
- ✅ Loading states and error handling
- ✅ User-friendly error messages
- ✅ Smooth transitions between auth states
- ✅ Dark/light theme support
- ✅ Flaticon icons integration

### Security Features:
- ✅ Firebase Authentication security
- ✅ Firestore security rules
- ✅ Input validation
- ✅ Error handling and logging

## Troubleshooting

### Common Issues:

1. **"Firebase not initialized" error**
   - Check that your Firebase config is correct in `js/firebase-config.js`
   - Ensure all Firebase services are enabled in your project

2. **"Permission denied" error**
   - Check your Firestore security rules
   - Ensure you're signed in before accessing user data

3. **Authentication not working**
   - Verify Email/Password authentication is enabled in Firebase
   - Check browser console for error messages

4. **Module import errors**
   - Ensure all script tags have `type="module"`
   - Check that all files are in the correct locations

### Development Tips:

1. **Testing with multiple users:**
   - Use different email addresses for testing
   - Clear browser data between tests

2. **Debugging:**
   - Open browser developer tools
   - Check the Console tab for error messages
   - Use the Network tab to see Firebase requests

3. **Production deployment:**
   - Update Firestore security rules for production
   - Consider enabling additional authentication methods
   - Set up proper domain restrictions in Firebase

## Next Steps

Once Firebase is set up, you can:

1. **Add more authentication methods:**
   - Google Sign-In
   - GitHub OAuth
   - Phone number authentication

2. **Enhance user profiles:**
   - Add profile pictures
   - Store user preferences
   - Add user roles and permissions

3. **Implement data synchronization:**
   - Sync tracking data to Firestore
   - Enable cross-device data access
   - Add real-time collaboration features

4. **Add advanced features:**
   - Email verification
   - Two-factor authentication
   - Account deletion

## Support

If you encounter issues:

1. Check the Firebase console for error logs
2. Review the browser console for JavaScript errors
3. Verify your Firebase configuration
4. Test with a fresh browser session

For more information, visit:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore) 