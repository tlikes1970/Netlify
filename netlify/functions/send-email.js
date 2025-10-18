// Netlify Function for sending emails via SendGrid
// This handles Pro tier email notifications using SendGrid Dynamic Templates

const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  console.log('📧 SendGrid email function called:', {
    method: event.httpMethod,
    hasBody: !!event.body,
    hasApiKey: !!process.env.SENDGRID_API_KEY,
  });

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      to,
      templateId,
      dynamicTemplateData,
      subject,
    } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !templateId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: 'to and templateId are required'
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid email format',
          details: 'Please provide a valid email address'
        }),
      };
    }

    // Initialize SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Email service not configured',
          details: 'SENDGRID_API_KEY is missing'
        }),
      };
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Prepare email message
    const msg = {
      to: to,
      from: process.env.FROM_EMAIL || 'notifications@flicklet.app',
      templateId: templateId,
      dynamicTemplateData: dynamicTemplateData || {},
      subject: subject || 'Flicklet Notification',
    };

    console.log('📧 Sending email via SendGrid:', {
      to: msg.to,
      templateId: msg.templateId,
      hasDynamicData: !!msg.dynamicTemplateData,
    });

    // Send email
    const response = await sgMail.send(msg);
    
    console.log('📧 Email sent successfully:', {
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
    });

    return {
      statusCode: 202, // Accepted - email queued for delivery
      body: JSON.stringify({
        ok: true,
        messageId: response[0].headers['x-message-id'],
      }),
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Handle SendGrid specific errors
    if (error.response) {
      const { statusCode, body } = error.response;
      console.error('SendGrid error details:', { statusCode, body });
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Email service error',
          details: `SendGrid error ${statusCode}: ${body?.errors?.[0]?.message || 'Unknown error'}`,
        }),
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send email',
        details: error.message || 'Unknown error occurred',
      }),
    };
  }
};




