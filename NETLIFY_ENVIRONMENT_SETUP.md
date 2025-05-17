# Netlify Environment Setup Guide

## Firebase Service Account Configuration

To configure Firebase Admin SDK on Netlify, you need to set up environment variables for authentication. Follow these steps:

1. Go to your Netlify site's dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add the following environment variables:

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key-with-quotes
ADMIN_EMAIL_PATTERN=admin
NODE_VERSION=16
```

**Important Note about FIREBASE_PRIVATE_KEY**

The `FIREBASE_PRIVATE_KEY` variable is often the trickiest part of setting up Firebase Admin SDK on Netlify. Here are three different methods to set it properly:

**Option 1: Direct Copy from JSON File**
Copy the entire raw value from your service account JSON file, including quotes:
```
"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANB...\n-----END PRIVATE KEY-----\n"
```

**Option 2: Replace Escaped Newlines with Actual Newlines**
Paste the private key into a text editor first. Replace all `\n` sequences with actual line breaks, then paste into the Netlify environment variable field.

**Option 3: Use the Netlify CLI** 
The Netlify CLI handles escaping properly:
```
netlify env:set FIREBASE_PRIVATE_KEY "$(cat path/to/service-account.json | jq -r '.private_key')"
```

> We've updated our code to handle various formats of the private key, so any of these methods should work.

## Other Environment Variables

Additionally, set these frontend environment variables:

```
REACT_APP_API_URL=/api
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-firebase-app-id
```

> **Note:** For the `REACT_APP_API_URL`, we use `/api` which will work with our Netlify redirects. Do not use the full URL with `.netlify/functions` as this would bypass our redirect rules.

## Testing Your Configuration

After setting these variables:
1. Deploy your site again (or trigger a new deploy)
2. Test admin functionality to ensure it works with the Firebase Admin SDK
3. Check your function logs in Netlify if you encounter any issues
