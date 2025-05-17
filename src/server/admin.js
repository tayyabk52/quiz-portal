// Firebase Admin SDK implementation for user management
const admin = require('firebase-admin');
const serviceAccount = require('../firebase/quiz-portal-a76c9-firebase-adminsdk-fbsvc-c882b8e421.json');

// Initialize Firebase Admin with service account
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Lists all users from Firebase Authentication
 * 
 * @param {Number} maxResults - Maximum number of users to return
 * @returns {Promise<Array>} - Array of user objects
 */
const listAllUsers = async (maxResults = 1000) => {
  try {
    // List batch of users, 1000 at a time.
    const listUsersResult = await admin.auth().listUsers(maxResults);
    
    // Map to a simpler format with only the data we need
    return listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
      customClaims: userRecord.customClaims
    }));
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
};

/**
 * Deletes multiple users from Firebase
 * 
 * @param {Array<string>} uids - Array of user UIDs to delete
 * @returns {Promise<Object>} - Results of the deletion operation
 */
const deleteMultipleUsers = async (uids) => {
  try {
    // Using the Admin SDK to delete users by UID
    const results = await admin.auth().deleteUsers(uids);
    
    return {
      successCount: results.successCount,
      failureCount: results.failureCount,
      errors: results.errors
    };
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
};

/**
 * Updates a user's account status (enabled or disabled)
 * 
 * @param {String} uid - User UID
 * @param {Boolean} disabled - Whether the account should be disabled
 * @returns {Promise<Object>} - Updated user record
 */
const setUserStatus = async (uid, disabled) => {
  try {
    // Update the user account
    const userRecord = await admin.auth().updateUser(uid, {
      disabled: disabled
    });
    
    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        disabled: userRecord.disabled
      }
    };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Generates password reset links for multiple users
 * 
 * @param {Array<string>} emails - Array of user email addresses
 * @returns {Promise<Object>} - Results with reset links
 */
const generatePasswordResetLinks = async (emails) => {
  try {
    const results = {
      successful: [],
      failed: [],
      total: emails.length
    };
    
    // Process each email sequentially
    for (const email of emails) {
      try {
        // Generate a password reset link
        const link = await admin.auth().generatePasswordResetLink(email);
        
        results.successful.push({
          email,
          resetLink: link
        });
      } catch (error) {
        results.failed.push({
          email,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error generating password reset links:', error);
    throw error;
  }
};

module.exports = {
  listAllUsers,
  deleteMultipleUsers,
  setUserStatus,
  generatePasswordResetLinks
};
