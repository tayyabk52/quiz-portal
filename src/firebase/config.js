// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  deleteUser,
  updatePassword,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, setDoc, doc, collection, getDocs, getDoc, deleteDoc } from "firebase/firestore";
import axios from 'axios';

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

// Admin API configuration
const ADMIN_API_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5000/api';
const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY;

// Admin API utility functions
const adminApi = {
  // Get all users from Firebase Authentication
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/users`, {
        headers: {
          'x-api-key': ADMIN_API_KEY
        }
      });
      return response.data.users;
    } catch (error) {
      console.error('Failed to get users from Admin API:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },
  
  // Delete multiple users by UID
  deleteUsers: async (uids) => {
    try {
      const response = await axios.post(`${ADMIN_API_URL}/users/delete`, {
        uids
      }, {
        headers: {
          'x-api-key': ADMIN_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to delete users via Admin API:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete users');
    }
  },
  
  // Generate password reset links for users
  resetPasswords: async (emails) => {
    try {
      const response = await axios.post(`${ADMIN_API_URL}/users/reset-password`, {
        emails
      }, {
        headers: {
          'x-api-key': ADMIN_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to reset passwords via Admin API:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset passwords');
    }
  }
};

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
  
  // Import additional Firestore functions
  const { setDoc, doc } = require("firebase/firestore");
  
  // Process users sequentially to avoid Firebase quota limits
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      // Also save user info to Firestore 'users' collection for tracking
      await setDoc(doc(db, "users", user.email), {
        email: user.email,
        rollNumber: user.rollNumber,
        createdAt: new Date(),
        uid: userCredential.user.uid
      });
      
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
 * Deletes multiple users from Firebase Auth using Admin SDK
 * 
 * @param {Array} emails - Array of user email addresses to delete
 * @param {String} adminPassword - Admin password for authentication
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
    
    // First get the UIDs for all emails
    // Try to get all users using Admin API
    const allUsers = await adminApi.getAllUsers();
    const userMap = new Map();
    
    allUsers.forEach(user => {
      userMap.set(user.email, user.uid);
    });
    
    // Create array of UIDs for users we want to delete
    const uidsToDelete = [];
    const emailsToProcess = [];
    
    emails.forEach(email => {
      const uid = userMap.get(email);
      if (uid) {
        uidsToDelete.push(uid);
        emailsToProcess.push(email);
      } else {
        results.failed.push({
          email,
          error: 'Could not find UID for this email'
        });
      }
    });
    
    // Delete the users using Admin API
    if (uidsToDelete.length > 0) {
      const deleteResults = await adminApi.deleteUsers(uidsToDelete);
      
      // Process successful deletions
      if (deleteResults.successCount > 0) {
        // Also delete Firestore data for each user
        for (let i = 0; i < emailsToProcess.length; i++) {
          const email = emailsToProcess[i];
          
          try {
            // Delete the user's document from Firestore 'users' collection
            await deleteDoc(doc(db, "users", email));
            
            results.successful.push({
              email: email
            });
            
            // Update progress
            onProgress({
              processed: i + 1,
              total: emailsToProcess.length,
              current: email,
              success: true
            });
          } catch (firestoreError) {
            console.warn(`Could not delete Firestore data for ${email}: ${firestoreError.message}`);
            // Still mark as successful since the auth user was deleted
            results.successful.push({
              email: email,
              warning: `Auth user deleted but Firestore data may remain: ${firestoreError.message}`
            });
          }
        }
      }
      
      // Process failures
      if (deleteResults.failureCount > 0) {
        deleteResults.errors.forEach(error => {
          const email = emails.find(e => userMap.get(e) === error.uid);
          results.failed.push({
            email: email || 'Unknown',
            error: error.message
          });
        });
      }
    }
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
    // Try using Admin API first for more reliable password reset
    try {
      const results = await adminApi.resetPasswords([email]);
      
      if (results.successful.length > 0) {
        const resetInfo = results.successful[0];
        return { 
          success: true,
          resetLink: resetInfo.resetLink // We can provide the direct link if needed
        };
      } else if (results.failed.length > 0) {
        throw new Error(results.failed[0].error);
      }
    } catch (adminApiError) {
      console.warn('Admin API password reset failed, falling back to client SDK:', adminApiError);
      // Fall back to client SDK if admin API fails
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
};

/**
 * Utility function to sync existing users from Auth to Firestore
 * This is useful for ensuring that any users created before the 'users' collection
 * was established are properly tracked
 * 
 * Note: This has limitations since client SDK can't list all users,
 * so it should be used as an admin operation
 * 
 * @param {Array} emails - Known user emails to sync to Firestore
 * @returns {Promise<Object>} Results of the sync operation
 */
export const syncUsersToFirestore = async (emails) => {
  const results = {
    successful: [],
    failed: [],
    total: emails.length
  };
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    try {
      // Check if user already exists in 'users' collection
      const userDoc = await doc(db, "users", email);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        // Create a document for this user
        await setDoc(doc(db, "users", email), {
          email: email,
          createdAt: new Date(),
          migratedUser: true
        });
        
        results.successful.push({ email });
      } else {
        // User already exists, count as successful but note it
        results.successful.push({ 
          email,
          note: "User already exists in collection" 
        });
      }
    } catch (error) {
      results.failed.push({
        email,
        error: error.message
      });
    }
  }
  
  return results;
};

// Export Admin API for direct usage when needed
export { auth, db, adminApi };
export default app;
