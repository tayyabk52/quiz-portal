// Netlify function to delete a specific user
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the delete-user function
const handler = async (event, context) => {
  // Allow both DELETE and GET methods (for flexibility with different client setups)
  if (event.httpMethod !== 'DELETE' && event.httpMethod !== 'GET') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  // Get the user ID from the path parameter
  const pathParts = event.path.split('/');
  const uid = pathParts[pathParts.length - 1];
  
  console.log('Delete user request for UID:', uid);
  console.log('Path parts:', pathParts);
  
  if (!uid || uid === 'delete-user') {
    return createResponse(400, { 
      error: 'User ID is required',
      path: event.path,
      pathParts: pathParts
    });
  }
  
  // Delete the user
  try {
    const result = await adminFunctions.deleteUser(uid);
    return createResponse(200, result);
  } catch (error) {
    console.error('Error deleting user:', error);
    return createResponse(500, { 
      error: error.message,
      details: 'Failed to delete user',
      uid: uid
    });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
