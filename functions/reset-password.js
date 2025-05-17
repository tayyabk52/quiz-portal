// Netlify function for resetting user passwords
const { adminFunctions } = require('../../src/server/admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the reset-password function
const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  // Parse request body
  const requestBody = JSON.parse(event.body);
  const { email } = requestBody;
  
  if (!email) {
    return createResponse(400, { error: 'Email is required' });
  }
  
  // Reset the user's password
  const result = await adminFunctions.resetPassword(email);
  
  return createResponse(200, result);
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
