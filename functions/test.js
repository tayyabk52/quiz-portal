// Simple test function to verify Netlify Functions are working correctly
exports.handler = async (event) => {
  try {
    console.log('Test function invoked', event.httpMethod);
    
    // Create a simple response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Hello from serverless function!',
        success: true,
        timestamp: new Date().toISOString()
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
