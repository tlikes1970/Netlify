// netlify/functions/feedback.js
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const feedback = JSON.parse(event.body);
    
    // Validate feedback data
    if (!feedback.text && !feedback.rating) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Feedback text or rating required' })
      };
    }

    // Add server-side metadata
    const enrichedFeedback = {
      ...feedback,
      serverTimestamp: new Date().toISOString(),
      ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown',
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // For now, we'll use Netlify's built-in form handling
    // You can also integrate with external services like Airtable, Google Sheets, etc.
    
    // Simple file-based storage (for demo - replace with database in production)
    console.log('FEEDBACK RECEIVED:', JSON.stringify(enrichedFeedback, null, 2));
    
    // TODO: Store in database/external service
    // Options:
    // 1. Airtable API
    // 2. Google Sheets API  
    // 3. Supabase
    // 4. Firebase
    // 5. Simple email notification
    
    // For immediate implementation, we'll send an email notification
    if (process.env.FEEDBACK_EMAIL) {
      try {
        // You can integrate with services like SendGrid, Mailgun, etc.
        // For now, just log the email content
        const emailContent = `
NEW FEEDBACK RECEIVED:

Rating: ${feedback.rating}/5
Text: ${feedback.text}
User: ${feedback.displayName}
Time: ${feedback.timestamp}
URL: ${feedback.url}
IP: ${enrichedFeedback.ip}
User Agent: ${feedback.userAgent}

---
ID: ${enrichedFeedback.id}
        `;
        
        console.log('EMAIL CONTENT:', emailContent);
        
        // TODO: Actually send email here
        // await sendEmail(process.env.FEEDBACK_EMAIL, 'New Feedback', emailContent);
        
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Feedback received',
        id: enrichedFeedback.id 
      })
    };

  } catch (error) {
    console.error('Feedback function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to process feedback'
      })
    };
  }
};