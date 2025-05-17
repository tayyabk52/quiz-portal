// Netlify function to delete a specific user
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the delete-user function
const handler = async (event, context) => {
  if (event.httpMethod !== 'DELETE') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  // Get the user ID from the path parameter
  const uid = event.path.split('/').pop();
  
  if (!uid) {
    return createResponse(400, { error: 'User ID is required' });
  }
  
  // Delete the user
  const result = await adminFunctions.deleteUser(uid);
  
  return createResponse(200, result);
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
