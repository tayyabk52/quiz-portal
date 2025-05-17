// Netlify function for bulk user deletion
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the bulk-delete-users function
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
    const { uids } = requestBody;
    
    console.log('Bulk delete request for UIDs:', uids);
    
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      return createResponse(400, { error: 'Invalid request. Expected array of uids.' });
    }
    
    // Delete users in bulk
    const result = await adminFunctions.bulkDeleteUsers(uids);
    
    return createResponse(200, result);
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return createResponse(500, {
      error: error.message,
      details: 'Failed to process bulk delete request'
    });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
