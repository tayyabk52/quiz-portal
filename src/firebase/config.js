// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
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

export { auth, db };
export default app;
