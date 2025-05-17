// Common wrapper for admin authentication in serverless functions
const withAdminAuth = (handler) => {
  return async (event, context) => {
    try {
      // Check if we should skip authentication for testing purposes
      if (process.env.DISABLE_AUTH_FOR_TESTING === 'true') {
        console.warn('⚠️ SECURITY WARNING: Authentication disabled for testing');
        return await handler(event, context);
      }
      
      console.log('Headers received for auth:', Object.keys(event.headers).join(', '));
      
      // Get the Authorization header
      const { authorization } = event.headers;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        console.log('Authorization header missing or invalid format');
        
        // For development only, continue without auth - REMOVE IN PRODUCTION
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ DEV MODE: Continuing without authentication');
          return await handler(event, context);
        }
        
        // For production, require proper authentication
        return createResponse(401, { 
          error: 'Unauthorized - No valid token provided',
          status: 'error'
        });
      }
      
      // Extract token
      const idToken = authorization.split('Bearer ')[1];
      console.log('Token extracted, starting admin verification');
      
      // Import admin
      const { admin, verifyAdminToken } = require('./admin');
      
      try {
        // Verify admin token
        const decodedToken = await verifyAdminToken({ headers: { authorization }});
        
        // Add the decoded token to the event
        event.adminUser = decodedToken;
        console.log('Admin user verified:', decodedToken.email);
        
        // Call the handler
        return await handler(event, context);
      } catch (authError) {
        console.error('Admin authentication error:', authError);
        
        // For development only, continue without auth - REMOVE IN PRODUCTION
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ DEV MODE: Bypassing admin auth after error');
          return await handler(event, context);
        }
        
        return createResponse(403, { 
          error: 'Authentication failed - Not authorized as admin',
          details: authError.message, 
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
