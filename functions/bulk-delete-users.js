// Netlify function for bulk user deletion
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the bulk-delete-users function
const handler = async (event, context) => {
  // Set function timeout warning at 8 seconds (Netlify's limit is 10s)
  const timeoutWarning = setTimeout(() => {
    console.warn('Function approaching timeout limit');
  }, 8000);
  
  if (event.httpMethod !== 'POST') {
    clearTimeout(timeoutWarning);
    return createResponse(405, { error: 'Method Not Allowed' });
  }
  
  try {
    // Parse request body
    if (!event.body) {
      clearTimeout(timeoutWarning);
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const requestBody = JSON.parse(event.body);
    const { uids } = requestBody;
    
    console.log(`Bulk delete request for ${uids?.length || 0} UIDs`);
    
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      clearTimeout(timeoutWarning);
      return createResponse(400, { error: 'Invalid request. Expected array of uids.' });
    }
    
    // Limit batch size for serverless function
    const MAX_BATCH_SIZE = 50;
    const processUids = uids.slice(0, MAX_BATCH_SIZE);
    
    if (uids.length > MAX_BATCH_SIZE) {
      console.warn(`Request contains ${uids.length} UIDs, limiting to ${MAX_BATCH_SIZE}`);
    }
    
    // Delete users in bulk
    const result = await adminFunctions.bulkDeleteUsers(processUids);
    
    clearTimeout(timeoutWarning);
    return createResponse(200, result);  } catch (error) {
    clearTimeout(timeoutWarning);
    console.error('Error in bulk delete function:', error);
    
    // Return a more detailed error response
    return createResponse(500, {
      error: error.message,
      details: 'Failed to process bulk delete request',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
