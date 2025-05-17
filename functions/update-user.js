// Netlify function for updating user information
const { admin } = require('../../src/server/admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the update-user function
const handler = async (event, context) => {
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  // Parse request body
  const requestBody = JSON.parse(event.body);
  const { uid, updates } = requestBody;
  
  if (!uid) {
    return createResponse(400, { error: 'User ID is required' });
  }
  
  if (!updates || typeof updates !== 'object') {
    return createResponse(400, { error: 'Updates object is required' });
  }
  
  try {
    // Get current user data
    const user = await admin.auth().getUser(uid);
    
    // Prepare updates for Auth
    const authUpdates = {};
    
    // Only include fields that can be updated in Auth
    if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
    if (updates.email !== undefined) authUpdates.email = updates.email;
    if (updates.phoneNumber !== undefined) authUpdates.phoneNumber = updates.phoneNumber;
    if (updates.disabled !== undefined) authUpdates.disabled = updates.disabled;
    
    // Update Auth user if we have any fields to update
    if (Object.keys(authUpdates).length > 0) {
      await admin.auth().updateUser(uid, authUpdates);
    }
    
    // Update Firestore user data if email exists
    if (user.email) {
      const firestore = admin.firestore();
      
      // Prepare updates for Firestore
      const firestoreUpdates = {};
      
      // Only include fields appropriate for Firestore
      if (updates.rollNumber !== undefined) firestoreUpdates.rollNumber = updates.rollNumber;
      if (updates.displayName !== undefined) firestoreUpdates.displayName = updates.displayName;
      if (updates.permissions !== undefined) firestoreUpdates.permissions = updates.permissions;
      
      // Add email to Firestore updates if it was changed
      if (updates.email !== undefined && updates.email !== user.email) {
        // If email changed, we need to update the document ID
        // First create the new document
        await firestore.collection('users').doc(updates.email).set({
          ...firestoreUpdates,
          email: updates.email,
          uid,
          updatedAt: new Date()
        });
        
        // Then delete the old document
        try {
          await firestore.collection('users').doc(user.email).delete();
        } catch (error) {
          console.warn(`Could not delete old user document for ${user.email}:`, error);
        }
      } else if (Object.keys(firestoreUpdates).length > 0) {
        // Update the existing document
        await firestore.collection('users').doc(user.email).update({
          ...firestoreUpdates,
          updatedAt: new Date()
        });
      }
    }
    
    // Get the updated user
    const updatedUser = await admin.auth().getUser(uid);
    
    return createResponse(200, {
      success: true,
      message: 'User updated successfully',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        disabled: updatedUser.disabled
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return createResponse(500, { error: error.message });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
