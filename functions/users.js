// Netlify function to list all users
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the users function
const handler = async (event, context) => {
  console.log('Users function invoked');
  
  if (event.httpMethod !== 'GET') {
    console.log(`Invalid method: ${event.httpMethod}`);
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  try {
    // List all users
    console.log('Fetching users from Firebase Admin SDK');
    const result = await adminFunctions.listUsers();
    console.log(`Found ${result.users?.length || 0} users`);
    
    return createResponse(200, result);
  } catch (error) {
    console.error('Error in users handler:', error);
    return createResponse(500, { 
      error: `Failed to list users: ${error.message}`,
      status: 'error'
    });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
