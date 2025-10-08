exports.handler = async function(event) {
  console.log('=== TEST PROXY CALLED ===');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Query params:', event.queryStringParameters);
  console.log('========================');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Test proxy is working!',
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters
    })
  };
};
