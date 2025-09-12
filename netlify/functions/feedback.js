exports.handler = async (event, context) => {
  // Strict CORS headers - only allow specific domains
  const allowedOrigins = [
    'https://flicklet.netlify.app',
    'https://zippy-meerkat-329c02.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8888',
    'http://127.0.0.1:8888'
  ];
  
  const origin = event.headers.origin || event.headers.referer || '';
  const isAllowedOrigin = allowedOrigins.some(allowed => 
    origin.startsWith(allowed)
  );
  
  // Reject requests from unknown origins
  if (!isAllowedOrigin && origin) {
    console.log('CORS: Rejected feedback request from origin:', origin);
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Forbidden', 
        message: 'Origin not allowed' 
      })
    };
  }
  
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://flicklet.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };

  // Debug logging
  console.log('=== FUNCTION CALLED ===');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);
  console.log('Body:', event.body);
  console.log('=====================');

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Handle GET request (for testing)
  if (event.httpMethod === 'GET') {
    console.log('Handling GET request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Feedback function is working!',
        endpoint: 'Use POST to submit feedback',
        timestamp: new Date().toISOString()
      })
    };
  }

  // Handle POST request (actual feedback)
  if (event.httpMethod === 'POST') {
    try {
      console.log('Processing POST request with feedback data');
      
      // Parse the feedback data
      let feedback;
      try {
        feedback = JSON.parse(event.body);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: parseError.message 
          })
        };
      }
      
      // Add server-side metadata
      const enhancedFeedback = {
        ...feedback,
        serverTimestamp: new Date().toISOString(),
        ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown',
        userAgent: event.headers['user-agent'] || 'unknown',
        netlifyId: context.awsRequestId || 'unknown'
      };

      // Log the feedback prominently
      console.log('=== FEEDBACK RECEIVED ===');
      console.log(JSON.stringify(enhancedFeedback, null, 2));
      console.log('📺 SHOW:', feedback.show || 'Unknown');
      console.log('⭐ RATING:', feedback.rating || 'N/A', '/5');
      console.log('💭 COMMENT:', feedback.comment || 'No comment');
      console.log('🌍 IP:', enhancedFeedback.ip);
      console.log('📱 DEVICE:', enhancedFeedback.userAgent?.slice(0, 50) + '...');
      console.log('========================');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          id: enhancedFeedback.id || 'unknown',
          message: 'Feedback received and logged successfully!',
          timestamp: enhancedFeedback.serverTimestamp
        })
      };
      
    } catch (error) {
      console.error('=== FUNCTION ERROR ===');
      console.error('Error processing feedback:', error);
      console.error('Stack:', error.stack);
      console.error('====================');
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: 'Failed to process feedback',
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // If we get here, it's an unsupported method
  console.log('Unsupported method:', event.httpMethod);
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ 
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'OPTIONS'],
      receivedMethod: event.httpMethod
    })
  };
};