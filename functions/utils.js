// Common wrapper for Netlify function responses
const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Or restrict to specific domains
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

// Error handler wrapper for functions
const withErrorHandling = (handler) => {
  return async (event, context) => {
    try {
      // Handle OPTIONS for CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return createResponse(200, {});
      }
      
      return await handler(event, context);
    } catch (error) {
      console.error('Function error:', error);
      
      // Return appropriate error response
      return createResponse(500, { 
        error: error.message,
        status: 'error'
      });
    }
  };
};

// Authentication wrapper for admin functions
const withAdminAuth = (handler) => {
  return async (event, context) => {
    try {
      // Get the Authorization header
      const { authorization } = event.headers;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return createResponse(401, { 
          error: 'Unauthorized - No token provided',
          status: 'error'
        });
      }
      
      // Extract token
      const idToken = authorization.split('Bearer ')[1];
      
      // Import admin
      const { admin, verifyAdminToken } = require('./admin');
      
      try {
        // Verify admin token
        const decodedToken = await verifyAdminToken({ headers: { authorization }});
        
        // Add the decoded token to the event
        event.adminUser = decodedToken;
        
        // Call the handler
        return await handler(event, context);
      } catch (authError) {
        console.error('Admin authentication error:', authError);
        
        return createResponse(403, { 
          error: 'Authentication failed - Not authorized as admin', 
          status: 'error'
        });
      }
    } catch (error) {
      console.error('Auth wrapper error:', error);
      
      return createResponse(500, { 
        error: error.message,
        status: 'error'
      });
    }
  };
};

module.exports = {
  createResponse,
  withErrorHandling,
  withAdminAuth
};
