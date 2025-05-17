// Netlify function for bulk user deletion
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the bulk-delete-users function
const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  // Parse request body
  const requestBody = JSON.parse(event.body);
  const { uids } = requestBody;
  
  if (!uids || !Array.isArray(uids) || uids.length === 0) {
    return createResponse(400, { error: 'Invalid request. Expected array of uids.' });
  }
  
  // Delete users in bulk
  const result = await adminFunctions.bulkDeleteUsers(uids);
  
  return createResponse(200, result);
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
