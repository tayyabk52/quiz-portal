// Netlify function for debugging environment and configuration
const { admin } = require('./admin');
const { createResponse, withErrorHandling } = require('./utils');

exports.handler = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: ''
      };
    }
    
    // Only respond to GET requests
    if (event.httpMethod !== 'GET') {
      return createResponse(405, { error: 'Method not allowed' });
    }
      // Test Firebase Admin SDK initialization
    let firebaseAdminInitialized = false;
    let authServiceWorking = false;
    let firestoreServiceWorking = false;
    let errorDetails = {};
    
    try {
      if (admin.apps.length > 0) {
        firebaseAdminInitialized = true;
        
        // Test auth service
        try {
          await admin.auth().listUsers(1);
          authServiceWorking = true;
        } catch (authError) {
          errorDetails.auth = authError.message;
        }
        
        // Test firestore service
        try {
          await admin.firestore().collection('users').limit(1).get();
          firestoreServiceWorking = true;
        } catch (firestoreError) {
          errorDetails.firestore = firestoreError.message;
        }
      }
    } catch (adminError) {
      errorDetails.admin = adminError.message;
    }
    
    // Gather debug info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      firebase: {
        adminInitialized: firebaseAdminInitialized,
        authServiceWorking,
        firestoreServiceWorking,
        errorDetails: Object.keys(errorDetails).length > 0 ? errorDetails : undefined
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'not set',
      netlifyEnvironment: process.env.CONTEXT || 'not set',
      // Check if environment variables exist (without revealing values)
      environmentVariables: {
        // Firebase Admin variables
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        ADMIN_EMAIL_PATTERN: !!process.env.ADMIN_EMAIL_PATTERN,
        // Netlify variables
        NETLIFY: !!process.env.NETLIFY,
        NETLIFY_DEV: !!process.env.NETLIFY_DEV,
        // React app variables
        REACT_APP_VARS_SET: !!(
          process.env.REACT_APP_FIREBASE_API_KEY || 
          process.env.REACT_APP_API_URL
        )
      },
      // Request info
      requestInfo: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: {
          ...event.headers,
          // Don't show authorization header for security
          authorization: event.headers.authorization ? '[REDACTED]' : undefined
        }
      }
    };
    
    // Try to load Firebase Admin
    try {
      const admin = require('./admin');
      debugInfo.firebaseAdmin = {
        initialized: !!admin.admin.apps.length,
        appCount: admin.admin.apps.length
      };
    } catch (error) {
      debugInfo.firebaseAdmin = {
        initialized: false,
        error: error.message
      };
    }
    
    // Return debug info
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(debugInfo)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
