// Firebase Admin SDK setup for serverless functions
const admin = require('firebase-admin');
const path = require('path');

// Helper function to process the private key from environment variable
const processPrivateKey = (key) => {
  if (!key) return null;
  
  // If the key doesn't start with "-----BEGIN PRIVATE KEY", it's probably still JSON encoded
  if (!key.trim().startsWith('"-----BEGIN')) {
    try {
      // Try to parse it assuming it's a JSON string
      return JSON.parse(key);
    } catch (e) {
      console.log('Private key is not in JSON format, using as-is');
    }
  }
  
  // Replace literal \n with newlines if needed
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }
  
  return key;
};

// Initialize Firebase Admin with service account if not already initialized
if (!admin.apps.length) {
  try {
    // Log environment variables (without sensitive data)
    console.log('Firebase Project ID:', process.env.FIREBASE_PROJECT_ID || 'Not set');
    console.log('Firebase Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? 'Is set' : 'Not set');
    console.log('Firebase Private Key:', process.env.FIREBASE_PRIVATE_KEY ? 'Is set' : 'Not set');
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin SDK credentials in environment variables');
    }
    
    // Process the private key to handle different formats
    const privateKey = processPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    console.log('Private key processed');
    
    // Initialize with the processed credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    console.error(error.stack);
  }
}

// Middleware to check admin authentication
const verifyAdminToken = async (req) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      throw new Error('No authorization token provided');
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;
    
    if (!userEmail || !userEmail.includes(process.env.ADMIN_EMAIL_PATTERN || 'admin')) {
      throw new Error('User is not an admin');
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Admin authentication error:', error);
    throw error;
  }
};

// Admin SDK functions
const adminFunctions = {
  // List all users
  listUsers: async () => {
    try {
      // Import our utility function
      const { safeFormatDate } = require('./utils');
      
      const userRecords = await admin.auth().listUsers();
      
      // Get user data from Firestore
      const firestore = admin.firestore();
      const usersCollection = firestore.collection('users');
      const resultsCollection = firestore.collection('results');
      
      // Fetch additional user data
      const usersSnapshot = await usersCollection.get();
      const userMetadata = {};
      
      usersSnapshot.forEach(doc => {
        userMetadata[doc.id] = doc.data();
      });
      
      // Fetch quiz results
      const resultsSnapshot = await resultsCollection.get();
      const quizResults = {};
      
      resultsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.userEmail) {
          quizResults[data.userEmail] = {
            lastQuiz: data.submittedAt,
            score: data.scorePercentage || data.score
          };
        }
      });
        // Combine data
      const enrichedUsers = userRecords.users.map(user => {
        const metadata = userMetadata[user.email] || {};
        const quizData = quizResults[user.email] || {};
        
        // Use our safe date formatting utility
        const createdAt = safeFormatDate(user.metadata.creationTime);
        const lastSignIn = safeFormatDate(user.metadata.lastSignInTime);
        const lastQuiz = safeFormatDate(quizData.lastQuiz);
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          disabled: user.disabled,
          createdAt: createdAt,
          lastSignIn: lastSignIn,
          rollNumber: metadata.rollNumber,
          hasAttemptedQuiz: !!quizData.lastQuiz,
          lastQuiz: lastQuiz,
          score: quizData.score
        };
      });
      
      return {
        users: enrichedUsers,
        total: userRecords.users.length
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  },
  
  // Delete a user
  deleteUser: async (uid) => {
    try {
      // Get user email before deleting (for Firestore cleanup)
      const userRecord = await admin.auth().getUser(uid);
      const userEmail = userRecord.email;
      
      // Delete from Firebase Auth
      await admin.auth().deleteUser(uid);
      
      // Delete from Firestore 'users' collection if exists
      try {
        const firestore = admin.firestore();
        await firestore.collection('users').doc(userEmail).delete();
      } catch (firestoreError) {
        console.warn(`Could not delete Firestore data for ${userEmail}:`, firestoreError);
      }
      
      return { success: true, message: `User ${uid} successfully deleted` };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
    // Bulk delete users
  bulkDeleteUsers: async (uids) => {
    try {
      console.log(`Starting bulk delete of ${uids.length} users`);
      
      const results = {
        successful: [],
        failed: [],
        total: uids.length,
        startTime: new Date().toISOString()
      };
      
      // Guard against too many operations at once
      if (uids.length > 100) {
        console.warn('Large batch detected. Processing first 100 users only.');
        uids = uids.slice(0, 100);
      }
      
      const firestore = admin.firestore();
      
      // Process in batches of 10 users at a time
      const BATCH_SIZE = 10;
      const batches = [];
      
      // Split into batches
      for (let i = 0; i < uids.length; i += BATCH_SIZE) {
        batches.push(uids.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Processing ${batches.length} batches of users`);
      
      // Process each batch sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length}, size: ${batch.length}`);
        
        // Process users in current batch
        for (const uid of batch) {
          try {
            console.log(`Deleting user with UID: ${uid}`);
            
            // Get user email before deleting
            let userEmail;
            try {
              const userRecord = await admin.auth().getUser(uid);
              userEmail = userRecord.email;
            } catch (getUserError) {
              console.warn(`Could not get user ${uid} before deletion:`, getUserError.message);
            }
            
            // Delete from Firebase Auth
            try {
              await admin.auth().deleteUser(uid);
            } catch (deleteAuthError) {
              throw new Error(`Auth deletion failed: ${deleteAuthError.message}`);
            }
            
            // Delete from Firestore 'users' collection if we got the email
            if (userEmail) {
              try {
                await firestore.collection('users').doc(userEmail).delete();
              } catch (firestoreError) {
                console.warn(`Could not delete Firestore data for ${userEmail}:`, firestoreError.message);
              }
            }
            
            results.successful.push({
              uid,
              email: userEmail || 'unknown'
            });
            
            console.log(`Successfully deleted user: ${uid}`);
          } catch (error) {
            console.error(`Failed to delete user ${uid}:`, error.message);
            
            results.failed.push({
              uid,
              error: error.message
            });
          }
        }
      }
      
      results.endTime = new Date().toISOString();
      console.log(`Bulk delete complete. Success: ${results.successful.length}, Failed: ${results.failed.length}`);
      
      return results;
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  },
    // Reset user password by email (sends reset link)
  resetPassword: async (email) => {
    try {
      const link = await admin.auth().generatePasswordResetLink(email);
      
      return {
        success: true,
        email,
        link,
        message: 'Password reset link generated successfully'
      };
    } catch (error) {
      console.error('Error generating password reset link:', error);
      throw error;
    }
  },
  
  // Reset user password by UID (directly sets new password)
  resetUserPassword: async (uid, newPassword) => {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      await admin.auth().updateUser(uid, {
        password: newPassword
      });
      
      return {
        success: true,
        uid,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  },
  
  // Create a user
  createUser: async (userData) => {
    try {
      const { email, password, displayName, rollNumber } = userData;
      
      // Create the user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0]
      });
      
      // Create a document in Firestore for additional user data
      const firestore = admin.firestore();
      await firestore.collection('users').doc(email).set({
        email,
        rollNumber,
        createdAt: new Date(),
        uid: userRecord.uid
      });
      
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        }
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  // Bulk create users
  bulkCreateUsers: async (users) => {
    try {
      const results = {
        successful: [],
        failed: [],
        total: users.length
      };
      
      const firestore = admin.firestore();
      
      // Process users sequentially to avoid Firebase quota limits
      for (const user of users) {
        try {
          // Create the user in Firebase Auth
          const userRecord = await admin.auth().createUser({
            email: user.email,
            password: user.password,
            displayName: user.displayName || user.email.split('@')[0]
          });
          
          // Create a document in Firestore for additional user data
          await firestore.collection('users').doc(user.email).set({
            email: user.email,
            rollNumber: user.rollNumber,
            createdAt: new Date(),
            uid: userRecord.uid
          });
          
          results.successful.push({
            email: user.email,
            rollNumber: user.rollNumber
          });
        } catch (error) {
          results.failed.push({
            email: user.email,
            rollNumber: user.rollNumber,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in bulk create:', error);
      throw error;
    }
  }
};

module.exports = {
  admin,
  verifyAdminToken,
  adminFunctions
};
