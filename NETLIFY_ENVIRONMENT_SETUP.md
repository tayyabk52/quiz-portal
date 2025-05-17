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
```

**Important Note about FIREBASE_PRIVATE_KEY**

For the `FIREBASE_PRIVATE_KEY` variable:
- Include the entire private key value including quotation marks
- Make sure to include all line breaks (Netlify will handle these)
- Copy directly from your service account JSON file

## Other Environment Variables

Additionally, set these frontend environment variables:

```
REACT_APP_API_URL=https://your-netlify-site.netlify.app/.netlify/functions
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-firebase-app-id
```

## Testing Your Configuration

After setting these variables:
1. Deploy your site again (or trigger a new deploy)
2. Test admin functionality to ensure it works with the Firebase Admin SDK
3. Check your function logs in Netlify if you encounter any issues
