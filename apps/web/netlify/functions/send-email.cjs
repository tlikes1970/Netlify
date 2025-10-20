// Netlify Function for sending emails via SendGrid
// This handles Pro tier email notifications using SendGrid Dynamic Templates

const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  console.log('📧 SendGrid email function called:', {
    method: event.httpMethod,
    hasBody: !!event.body,
    hasApiKey: !!process.env.SENDGRID_API_KEY,
    ctx: process.env.CONTEXT
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
      console.error('❌ SENDGRID_API_KEY not found');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Email service not configured',
          details: 'SENDGRID_API_KEY missing'
        }),
      };
    }

    const FROM = process.env.SENDGRID_FROM;
    if (!FROM) {
      console.error('❌ SENDGRID_FROM not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Email service not configured',
          details: 'SENDGRID_FROM missing'
        }),
      };
    }
    const REPLY_TO = process.env.SENDGRID_REPLY_TO;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Prepare email message
    const msg = {
      to,
      from: FROM,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      templateId,
      dynamicTemplateData: dynamicTemplateData || {},
      subject: subject || 'Flicklet Notification',
      categories: ['flicklet', 'notifications']
    };

    console.log('📧 Sending email via SendGrid:', {
      to: msg.to,
      templateId: msg.templateId,
      hasDynamicData: !!msg.dynamicTemplateData,
      from: msg.from
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
    const status = error?.response?.statusCode;
    const body = error?.response?.body;
    console.error('❌ SendGrid fail', { status, body, msg: error.message });
    const details =
      (body?.errors && Array.isArray(body.errors) && body.errors.map(e => e.message).join('; ')) ||
      error.message ||
      'Unknown error';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service error', details }),
    };
  }
};





