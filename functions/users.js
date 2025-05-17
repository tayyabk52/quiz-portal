// Netlify function to list all users
const { adminFunctions } = require('../../src/server/admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the users function
const handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  // List all users
  const result = await adminFunctions.listUsers();
  
  return createResponse(200, result);
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
