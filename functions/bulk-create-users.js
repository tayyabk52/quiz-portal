// Netlify function for bulk user creation
const { adminFunctions } = require('./admin');
const { createResponse, withErrorHandling, withAdminAuth } = require('./utils');

// Handler for the bulk-create-users function
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
    const { users } = requestBody;
    
    console.log(`Bulk create request for ${users?.length || 0} users`);
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      clearTimeout(timeoutWarning);
      return createResponse(400, { error: 'Invalid request. Expected array of users.' });
    }
    
    // Limit batch size for serverless function
    const MAX_BATCH_SIZE = 50;
    const processUsers = users.slice(0, MAX_BATCH_SIZE);
    
    if (users.length > MAX_BATCH_SIZE) {
      console.warn(`Request contains ${users.length} users, limiting to ${MAX_BATCH_SIZE}`);
    }
    
    // Create users in bulk
    const result = await adminFunctions.bulkCreateUsers(processUsers);
    
    clearTimeout(timeoutWarning);
    return createResponse(200, result);
  } catch (error) {
    clearTimeout(timeoutWarning);
    console.error('Error in bulk create function:', error);
    
    // Return a more detailed error response
    return createResponse(500, {
      error: error.message,
      details: 'Failed to process bulk create request',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// Export the function with error handling and admin auth wrappers
exports.handler = withErrorHandling(withAdminAuth(handler));
