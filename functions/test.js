// Enhanced test function to verify Netlify Functions are working correctly
exports.handler = async (event) => {
  try {
    console.log('Test function invoked', event.httpMethod, 'from', event.headers['client-ip']);
    
    // Get environment info (without exposing sensitive data)
    const environmentInfo = {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'unknown',
      hasFirebaseEnvVars: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      },
      netlifyInfo: {
        site: process.env.SITE_NAME || process.env.URL || 'unknown',
        deployID: process.env.DEPLOY_ID || 'unknown',
        deployURL: process.env.DEPLOY_URL || 'unknown'
      }
    };
    
    // Create a comprehensive response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Hello from serverless function!',
        success: true,
        timestamp: new Date().toISOString(),
        environment: environmentInfo,
        request: {
          method: event.httpMethod,
          path: event.path,
          queryParameters: event.queryStringParameters,
          headers: {
            // Include only safe headers
            accept: event.headers.accept,
            'user-agent': event.headers['user-agent'],
            referer: event.headers.referer,
            'content-type': event.headers['content-type'],
            host: event.headers.host
          }
        }
      })
    };
  } catch (error) {
    console.error('Error in test function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
