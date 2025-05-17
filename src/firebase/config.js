// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Log warning if environment variables are missing
if (!process.env.REACT_APP_FIREBASE_API_KEY) {
  console.warn("Firebase environment variables are missing. Make sure you have a .env.local file in your project root. See FIREBASE_SETUP.md for instructions.");
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
 const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Creates multiple user accounts in Firebase Auth
 * 
 * @param {Array} users - Array of user objects with email and password
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<Object>} Results of the bulk operation
 */
export const createMultipleUsers = async (users, onProgress = () => {}) => {
  const results = {
    successful: [],
    failed: [],
    total: users.length
  };
  
  // Process users sequentially to avoid Firebase quota limits
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      // Create user with email and password
      await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      results.successful.push({
        email: user.email,
        rollNumber: user.rollNumber
      });
      
      // Update progress
      onProgress({
        processed: i + 1,
        total: users.length,
        current: user.email,
        success: true
      });
    } catch (error) {
      results.failed.push({
        email: user.email,
        rollNumber: user.rollNumber,
        error: error.message
      });
      
      // Update progress
      onProgress({
        processed: i + 1,
        total: users.length,
        current: user.email,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Deletes multiple users from Firebase Auth
 * 
 * @param {Array} emails - Array of user email addresses to delete
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<Object>} Results of the bulk operation
 */
export const deleteUsers = async (emails, adminPassword, onProgress = () => {}) => {
  const results = {
    successful: [],
    failed: [],
    total: emails.length
  };
  
  // Admin must be signed in to delete users
  try {
    // Sign in as admin (using current admin email)
    const adminEmail = auth.currentUser.email;
    
    // Reauthenticate the admin user first
    const credential = EmailAuthProvider.credential(adminEmail, adminPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Process users sequentially
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      try {
        // Delete user account
        // Note: In a production app, you would use Firebase Admin SDK via a backend
        // This is a simplified implementation for demonstration
        
        // First sign in as the user (this is a limitation of client-side Firebase)
        await signInWithEmailAndPassword(auth, email, "temporary-password");
        await deleteUser(auth.currentUser);
        
        results.successful.push({
          email: email
        });
        
        // Update progress
        onProgress({
          processed: i + 1,
          total: emails.length,
          current: email,
          success: true
        });
      } catch (error) {
        results.failed.push({
          email: email,
          error: error.message
        });
        
        // Update progress
        onProgress({
          processed: i + 1,
          total: emails.length,
          current: email,
          success: false,
          error: error.message
        });
      }
    }
    
    // Sign back in as admin
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    
  } catch (error) {
    return {
      successful: [],
      failed: emails.map(email => ({ email, error: "Admin authentication failed" })),
      total: emails.length,
      adminError: error.message
    };
  }
  
  return results;
};

/**
 * Reset password for a user
 * 
 * @param {String} email - Email address of the user
 * @returns {Promise<Object>} Result of the reset operation
 */
export const resetUserPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
};

export { auth, db };
export default app;
