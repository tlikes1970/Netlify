/**
 * Feedback submissions → email (SendGrid).
 * Used instead of Netlify Forms alone: SPA catch-all POST / can return index.html 200 without
 * recording a form submission, so notifications never fire.
 */

async function sendMail({ apiKey, to, from, subject, text, html }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    throw new Error(`SendGrid request failed (${response.status}): ${detail}`);
  }
}

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
      'feedback@flicklet.app';
    const from =
      process.env.FROM_EMAIL ||
      process.env.SENDGRID_FROM ||
      'noreply@flicklet.app';

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

    await sendMail({
      apiKey,
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
