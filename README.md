# Quiz Web Portal

An interactive quiz web portal built with React, Firebase, and hosted on Netlify. This application provides a secure environment for students to take quizzes with features like image-based questions, time limits, authentication, and security measures.

**Last updated: May 23, 2025**

## Features

### Authentication
- One-time login with assigned usernames and passwords
- Secure session management
- Role-based access (students vs. admin)

### Quiz Features
- Multiple-choice questions with image support
- Configurable time limits for each question
- Sequential navigation without revisiting completed questions
- Automatic submission on timeout

### Result Management
- Immediate feedback after quiz completion
- Score calculation and presentation
- Storage of results in Firebase for future reference
- Previous attempts history

### Security Features
- Prevention of tab/window switching during quiz
- Warning notification for first infraction
- Automatic submission on second infraction
- Protection against unauthorized access

## Project Structure

```
quiz-portal/
├── public/           # Static files
│   ├── images/       # Question images
│   ├── index.html    # HTML template
│   └── _redirects    # Netlify redirect rules
├── src/
│   ├── components/   # React components
│   │   ├── admin/    # Admin dashboard components
│   │   ├── auth/     # Authentication components
│   │   ├── layout/   # Layout components
│   │   ├── quiz/     # Quiz-related components
│   │   └── result/   # Result display components
│   ├── context/      # React context for state management
│   ├── firebase/     # Firebase configuration
│   ├── App.js        # Main app component
│   └── index.js      # Application entry point
├── package.json      # Project dependencies
└── netlify.toml      # Netlify configuration
```

## Installation and Setup

### Prerequisites
- Node.js and npm installed
- Firebase account
- Netlify account (for deployment)

### Local Development

1. Clone the repository:
   ```
   git clone <repository-url>
   cd quiz-portal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Firebase project and set up:
   - Authentication with email/password
   - Firestore database
   - Storage for images

4. Update Firebase configuration:
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your Firebase project configuration

5. Run the development server:
   ```
   npm start
   ```

6. Open `http://localhost:3000` in your browser

### Deployment to Netlify

1. Set up your environment variables in a `.env` file:
   ```
   REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Deploy to Netlify using one of these methods:
   - Connect to your GitHub repository in Netlify dashboard
   - Use Netlify CLI: `netlify deploy --prod`
   - Drag and drop the `build` folder to Netlify dashboard

4. Set up environment variables in Netlify dashboard for Firebase configuration
   - Go to Site Settings > Build & Deploy > Environment
   - Add all the Firebase environment variables from your .env file

For detailed deployment instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

## Admin Access

To access the admin panel:
1. Create a user with an email containing "admin" (e.g., admin@quizportal.com)
2. Log in with this account
3. Navigate to `/admin` route

## Security Considerations

- In a production environment, implement proper Firebase security rules
- Set up user roles in Firebase to control access to admin features
- Add rate limiting for login attempts
- Consider enabling Firebase App Check for additional security

## License

This project is licensed under the MIT License - see the LICENSE file for details.
