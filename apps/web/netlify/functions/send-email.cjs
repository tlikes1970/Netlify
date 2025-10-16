// apps/web/netlify/functions/send-email.cjs
// POST JSON: { to, templateId, dynamicTemplateData, subject? }
// Env required: SENDGRID_API_KEY, EMAIL_FROM
// Optional env: EMAIL_REPLY_TO

const API = 'https://api.sendgrid.com/v3/mail/send';

const cors = (type = 'application/json; charset=utf-8') => ({
  'Content-Type': type,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
});

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors('text/plain'), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const key = (process.env.SENDGRID_API_KEY || '').trim();
  console.log('sgKeyLast6:', key ? key.slice(-6) : 'none');
  const from = (process.env.EMAIL_FROM || '').trim();
  const replyTo = (process.env.EMAIL_REPLY_TO || '').trim();

  if (!key || !from) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: 'Server misconfig', message: 'Missing SENDGRID_API_KEY or EMAIL_FROM' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { to, templateId, dynamicTemplateData, subject } = payload || {};
  if (!to || !templateId) {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify({ error: 'Missing "to" or "templateId"' })
    };
  }

  const body = {
    personalizations: [{
      to: Array.isArray(to) ? to.map(x => ({ email: x })) : [{ email: to }],
      dynamic_template_data: dynamicTemplateData || {}
    }],
    from: { email: from },
    ...(replyTo ? { reply_to: { email: replyTo } } : {}),
    ...(subject ? { subject } : {}),
    template_id: templateId
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: cors(),
        body: JSON.stringify({
          error: 'SendGrid error',
          status: res.status,
          statusText: res.statusText,
          details: text.slice(0, 1000)
        })
      };
    }

    return { statusCode: 202, headers: cors(), body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return {
      statusCode: 502,
      headers: cors(),
      body: JSON.stringify({ error: 'Upstream failure', message: String(err) })
    };
  }
};
