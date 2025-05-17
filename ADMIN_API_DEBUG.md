# Admin API Debugging Guide

This document explains how to debug issues with the Admin API functions and authentication.

## Current Status

The Admin API provides the following functionality:

- ✅ List all users (both from Authentication and Firestore)
- ✅ Delete users directly through the Authentication system
- ✅ Edit user information
- ✅ Reset user passwords
- ✅ Bulk delete users

## Authentication Behavior

For easier debugging, the authentication requirements have been temporarily relaxed in the Netlify functions. In development mode, the functions will:

1. Allow requests without valid authentication tokens
2. Log detailed information about authentication attempts
3. Bypass authentication failures to allow API testing

## Enabling Strict Authentication

When deploying to production, you should enable strict authentication by editing `functions/utils.js` and uncomment the production code sections:

```javascript
// In functions/utils.js
if (!authorization || !authorization.startsWith('Bearer ')) {
  console.log('Authorization header missing or invalid format');
  
  // Comment this out:
  // console.log('Continuing without auth for debugging');
  // return await handler(event, context);
  
  // Uncomment this:
  return createResponse(401, { 
    error: 'Unauthorized - No token provided',
    status: 'error'
  });
}
```

And also update the auth error handling:

```javascript
catch (authError) {
  console.error('Admin authentication error:', authError);
  
  // Comment this out:
  // console.log('Continuing without auth after error for debugging');
  // return await handler(event, context);
  
  // Uncomment this:
  return createResponse(403, { 
    error: 'Authentication failed - Not authorized as admin', 
    status: 'error'
  });
}
```

## Troubleshooting Common Issues

### 1. API Request 502 Errors

If you're seeing 502 errors, this typically indicates that the serverless function is timing out or crashing. Check:

- Netlify function logs for error messages
- Whether your Firebase Admin SDK credentials are valid
- If your function is trying to access too many records at once

### 2. Authentication Issues

If admin API calls are failing with auth errors:

- Verify the user has an email containing the text specified in the ADMIN_EMAIL_PATTERN environment variable
- Check that the Firebase Admin SDK is properly initialized
- Use the `/api/debug` endpoint to verify the environment is correctly set up

### 3. Date Format Issues

If you're seeing errors related to dates like "toLocaleDateString is not a function":

- The client-side code in UserManagementSection.js has been updated to safely handle various date formats
- The server-side code in admin.js uses the safeFormatDate utility to ensure consistent date formatting

## API Endpoints

- **GET /api/users** - List all users
- **DELETE /api/users/:uid** - Delete a specific user
- **POST /api/users/bulk-delete** - Delete multiple users
- **POST /api/users/reset-password** - Reset a user's password
- **POST /api/users/update** - Update user information
- **GET /api/test** - Test API connectivity
- **GET /api/debug** - Get detailed environment information
