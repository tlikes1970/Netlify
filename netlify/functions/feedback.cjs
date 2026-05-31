/**
 * Feedback submissions → email (SendGrid).
 * Used instead of Netlify Forms alone: SPA catch-all POST / can return index.html 200 without
 * recording a form submission, so notifications never fire.
 */

const sgMail = require('@sendgrid/mail');

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        ...jsonHeaders,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const message = String(body.message || '').trim();
    const theme = String(body.theme || 'light');
    const timestamp = String(body.timestamp || new Date().toISOString());

    if (!message) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('[feedback] SENDGRID_API_KEY is not set');
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Email service not configured' }),
      };
    }

    const to =
      process.env.FEEDBACK_EMAIL ||
      process.env.CONTACT_EMAIL ||
      '';
    const from = process.env.FROM_EMAIL || process.env.SENDGRID_FROM || '';

    if (!to || !from) {
      console.error('[feedback] Set FEEDBACK_EMAIL and FROM_EMAIL (or SENDGRID_FROM)');
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Feedback inbox not configured' }),
      };
    }

    sgMail.setApiKey(apiKey);

    const text = [
      'New Flicklet feedback',
      '',
      `Theme: ${theme}`,
      `Timestamp: ${timestamp}`,
      '',
      'Message:',
      message,
      '',
      '---',
      'Sent from Flicklet',
    ].join('\n');

    await sgMail.send({
      to,
      from,
      subject: `Flicklet feedback (${theme})`,
      text,
      html: text.replace(/\n/g, '<br>'),
    });

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('[feedback]', err);
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Failed to send feedback' }),
    };
  }
};
