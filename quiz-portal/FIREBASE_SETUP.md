# Firebase and Google Drive Setup Guide for Quiz Portal

This guide explains how to set up your quiz portal with Firebase for authentication, database management, and Google Drive for image hosting.

## Firebase Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Quiz Portal")
4. Follow the setup wizard
5. Click "Create project"

### 2. Configure Firebase Authentication

1. In the Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" authentication
4. Create test users:
   - A student account (e.g., student1@quizportal.com)
   - An admin account (make sure the email contains "admin", e.g., admin@quizportal.com)

### 3. Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in test mode for development (you can set rules later)
4. Choose a location closest to your users
5. Create two collections:

#### Questions Collection

Structure for each document:
```
question: String (the question text)
options: Array<String> (array of answer options)
correctAnswer: Number (index of correct option, 0-based)
timeLimit: Number (time limit in seconds)
imageUrl: String (Google Drive image URL)
```

#### Results Collection

This will be populated automatically when students take quizzes.

### 4. Update Firebase Configuration

Make sure your Firebase configuration in `src/firebase/config.js` matches the one from your Firebase project.

## Google Drive for Image Hosting

Instead of using Firebase Storage, we'll use Google Drive to host images and then include them in our questions.

### 1. Prepare Images for Questions

1. Upload your question images to Google Drive
2. For each image:
   - Right-click on the file
   - Select "Share"
   - Change permissions to "Anyone with the link can view"
   - Copy link

### 2. Create Shareable Links

To get the correct format for image URLs:

1. Upload your image to Google Drive
2. Right-click on the file and select "Share"
3. Make sure the access is set to "Anyone with the link can view" 
4. Copy the link
5. When adding this URL to a question in the admin panel, the application will automatically convert it to a format that works for direct image display

### 3. Using Images in Questions

When adding a new question in the Admin panel:

1. Fill out the question text and options
2. Paste the Google Drive shared link in the "Image URL" field
3. The application will automatically convert this to a direct image URL when displaying the quiz

### Example of Adding a Question with Image

1. Log in with your admin account
2. Navigate to the Admin panel
3. Click "Add Question"
4. Fill in the question details
5. Paste the Google Drive shared link in the "Image URL" field
6. Submit the question

## Recommended Image Guidelines

For best performance and appearance:

1. Use images with aspect ratios close to 16:9 or 4:3
2. Keep image file sizes under 1MB for faster loading
3. Use PNG or JPEG formats
4. Recommended dimensions: 800-1200px width

## Troubleshooting

If images are not displaying:

1. Verify the Google Drive sharing settings
2. Make sure the URL is correctly pasted
3. Check browser console for any errors
4. Try a different image to see if the issue persists

## Security Considerations

- While this approach is easier to set up than Firebase Storage, be aware that Google Drive links can expire
- For a more permanent solution, consider migrating to Firebase Storage in the future
- Don't use Google Drive for sensitive images, as shared links can potentially be accessed by anyone with the link
