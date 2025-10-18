// Simple test function to verify Netlify functions are working
export const config = { path: '/api/test' };

export async function handler(event: any) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Netlify functions are working!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      query: event.queryStringParameters,
    }),
  };
}
