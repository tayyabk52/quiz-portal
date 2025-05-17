# Quiz Portal Netlify Deployment Guide

This document provides step-by-step instructions for deploying the Quiz Portal application to Netlify, with a focus on the Firebase Admin SDK functionality.

## Prerequisites

1. A Firebase project with Authentication and Firestore enabled
2. A Netlify account
3. The Quiz Portal codebase ready for deployment

## Step 1: Prepare Your Firebase Service Account

1. Go to Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key" to download your service account JSON file
3. Keep this file secure and NEVER commit it to version control

## Step 2: Set Up Netlify Site

1. Log in to Netlify
2. Click "New site from Git"
3. Connect to your Git provider and select the Quiz Portal repository
4. Use the following build settings:
   - Build command: `CI= npm run build`
   - Publish directory: `build`
   - Environment variables: (See Step 3)

## Step 3: Configure Environment Variables

In Netlify, go to Site settings → Environment variables and add:

### Firebase Admin SDK Variables (Server-side)

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key-with-quotes
ADMIN_EMAIL_PATTERN=admin
NODE_VERSION=16
```

### Firebase Client Variables (Browser-side)

```
REACT_APP_API_URL=/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

> **Important:** For the `FIREBASE_PRIVATE_KEY` variable, copy the exact string from your service account JSON file, including quotation marks at the beginning and end.

## Step 4: Deploy the Site

1. Trigger deployment by pushing to your Git repository or using the "Deploy site" button in Netlify
2. Wait for the build to complete
3. Visit your new Netlify site URL

## Troubleshooting Common Issues

### 1. Firebase Admin SDK Initialization Failures

**Symptoms:**
- Admin functions return "Firebase App named '[DEFAULT]' already exists" error
- Users cannot be fetched from the admin interface

**Solutions:**
- Double-check all environment variables in Netlify
- Ensure your private key format is correct (see below)
- Check Netlify function logs for specific error messages

**Correct Private Key Format:**
The `FIREBASE_PRIVATE_KEY` should include the quotes and newlines:
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

### 2. API Connection Issues

**Symptoms:**
- "Unexpected token < in JSON" errors
- Admin interface shows HTML error instead of user data

**Solutions:**
- Verify redirects are properly configured in both `netlify.toml` and `public/_redirects`
- Test the `/api/test` endpoint to check if functions are accessible
- Check browser network tab for 404 errors or redirect issues

### 3. Authentication Problems

**Symptoms:**
- "Not an admin user" errors
- "Authentication failed" messages

**Solutions:**
- Verify the `ADMIN_EMAIL_PATTERN` environment variable matches your admin email
- Check that you're logged in with an admin account
- Inspect the authorization token being sent in API requests

### 4. Runtime Errors in Functions

**Symptoms:**
- 500 errors from API endpoints
- Functions timing out

**Solutions:**
- Check Netlify Functions log for error messages
- Ensure Firebase-admin package is included in both root and functions package.json
- Verify your Firebase project has Firestore and Auth enabled

## Testing the Deployment

1. Log in using an admin account (email containing the text in ADMIN_EMAIL_PATTERN)
2. Navigate to the Admin section
3. Verify that users are displayed correctly
4. Test user management operations:
   - Reset a user's password
   - Delete a user
   - Edit user information

## Support Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
