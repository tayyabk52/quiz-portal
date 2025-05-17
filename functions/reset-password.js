// Netlify function for resetting user passwords
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the reset-password function
const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  try {
    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const requestBody = JSON.parse(event.body);
    const { email, uid, newPassword } = requestBody;
    
    console.log('Reset password request for:', email || uid);
    
    // Email-based reset
    if (email) {
      const result = await adminFunctions.resetPassword(email);
      return createResponse(200, result);
    } 
    // UID-based reset with new password
    else if (uid && newPassword) {
      const result = await adminFunctions.resetUserPassword(uid, newPassword);
      return createResponse(200, result);
    } else {
      return createResponse(400, { error: 'Either email or uid with new password is required' });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return createResponse(500, {
      error: error.message,
      details: 'Failed to reset password'
    });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
