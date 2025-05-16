# Netlify Deployment Guide for Quiz Portal

This guide explains how to deploy your Quiz Portal to Netlify and properly set up environment variables for Firebase integration.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account where your project repository is hosted
- A Netlify account (you can sign up for free at [netlify.com](https://www.netlify.com))
- Firebase project already set up (refer to FIREBASE_SETUP.md)

## Deployment Steps

### 1. Prepare Your Environment Variables

1. Make sure you have obtained all necessary Firebase configuration keys from your Firebase project.
2. Locally, ensure that your `.env` file in the root of your project contains all required variables:
   ```
   REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### 2. Deploy to Netlify

#### Option 1: Deploy via the Netlify Web Interface

1. Log in to your [Netlify account](https://app.netlify.com/)
2. Click on "New site from Git"
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your quiz-portal repository
6. Configure build settings:
   - Base directory: Leave blank (or specify if your project is in a subdirectory)
   - Build command: `CI= npm run build`
   - Publish directory: `build`
7. Click "Deploy site"

#### Option 2: Deploy via the Netlify CLI

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Log in to your Netlify account: `netlify login`
3. Initialize your project: `netlify init`
4. Follow the prompts to create a new site or link to an existing one
5. Deploy your site: `netlify deploy --prod`

### 3. Configure Environment Variables in Netlify

After deployment, you need to set up your Firebase environment variables:

1. Go to your site's dashboard on Netlify
2. Navigate to "Site settings" → "Build & deploy" → "Environment"
3. Click "Edit variables"
4. Add each environment variable from your `.env` file:
   - Key: `REACT_APP_FIREBASE_API_KEY`, Value: Your Firebase API key
   - Key: `REACT_APP_FIREBASE_AUTH_DOMAIN`, Value: Your Firebase auth domain
   - ...and so on for each environment variable
5. Click "Save"

### 4. Trigger a New Deployment

After setting up the environment variables:

1. Go to "Deploys" in your Netlify dashboard
2. Click "Trigger deploy" → "Deploy site"
3. Wait for the build to complete

### 5. Test Your Deployed Application

1. Once deployment is complete, click on the URL provided by Netlify to view your site
2. Test the authentication functionality by logging in with a test user account
3. Verify that other features work correctly

## Troubleshooting

### Environment Variables Not Working

If your Firebase configuration isn't being recognized after deployment:

1. Verify that all environment variables are correctly set in Netlify
2. Make sure your code properly references these environment variables
3. Check if your Firebase configuration requires additional security rules
4. Try clearing your browser cache and reloading the site

### Authentication Issues

If users cannot authenticate:

1. Verify that Firebase Authentication is properly configured in your Firebase console
2. Check if the Firebase API key and auth domain are correct
3. Ensure that the Authentication method (Email/Password) is enabled in Firebase
4. Create test users if needed (refer to FIREBASE_SETUP.md)

## Custom Domain Setup (Optional)

To set up a custom domain for your quiz portal:

1. In Netlify, go to "Site settings" → "Domain management"
2. Click "Add custom domain"
3. Follow the instructions to verify your domain ownership
4. Update DNS settings as instructed by Netlify

## Automatic Deployments

Netlify automatically redeploys your site when you push changes to the connected Git repository. No additional configuration is required.

---

Remember that your Firebase credentials should be kept secure. Never commit the actual values in your `.env` file to your public repository.
