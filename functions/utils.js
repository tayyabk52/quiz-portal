// Helper function to safely convert Firebase/Firestore dates to ISO strings
const safeFormatDate = (dateVal) => {
  if (!dateVal) return null;
  
  try {
    // Handle Firestore Timestamp objects
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toISOString();
    }
    
    // Handle serialized Firestore timestamps with _seconds
    if (dateVal._seconds) {
      return new Date(dateVal._seconds * 1000).toISOString();
    }
    
    // Handle Date objects
    if (dateVal instanceof Date) {
      return dateVal.toISOString();
    }
    
    // Handle string dates
    if (typeof dateVal === 'string') {
      const date = new Date(dateVal);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    
    return null;
  } catch (e) {
    console.warn('Failed to format date:', dateVal);
    return null;
  }
};

// Common wrapper for Netlify function responses
const createResponse = (statusCode, body) => {
  console.log(`Creating response with status: ${statusCode}`);
  
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
      console.log(`Function invoked: ${event.path}, Method: ${event.httpMethod}`);
      
      // Handle OPTIONS for CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        console.log('Handling OPTIONS request for CORS');
        return createResponse(200, {});
      }
      
      // Log request details for debugging
      if (event.body) {
        try {
          const bodyContent = JSON.parse(event.body);
          console.log('Request body:', JSON.stringify(bodyContent, null, 2).substring(0, 500) + '...');
        } catch (parseError) {
          console.log('Could not parse request body');
        }
      }
      
      return await handler(event, context);
    } catch (error) {
      console.error('Function error:', error);
      console.error('Error stack:', error.stack);
      
      // Return appropriate error response
      return createResponse(500, { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        status: 'error'
      });
    }
  };
};

// Authentication wrapper for admin functions
const withAdminAuth = (handler) => {
  return async (event, context) => {
    try {
      console.log('Headers received:', JSON.stringify(event.headers));
      
      // Get the Authorization header
      const { authorization } = event.headers;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        console.log('Authorization header missing or invalid format');
        // Try to continue without auth for debugging - REMOVE THIS IN PRODUCTION
        console.log('Continuing without auth for debugging');
        return await handler(event, context);
        
        // Uncomment this in production:
        // return createResponse(401, { 
        //   error: 'Unauthorized - No token provided',
        //   status: 'error'
        // });
      }
      
      // Extract token
      const idToken = authorization.split('Bearer ')[1];
      console.log('Token extracted, starting auth verification');
      
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
  withAdminAuth,
  safeFormatDate
};
