// Netlify Function for sending email notifications
// This handles Pro tier email notifications

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      email,
      showName,
      episodeTitle,
      seasonNumber,
      episodeNumber,
      airDate,
    } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !showName || !episodeTitle) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Format air date
    const airDateFormatted = new Date(airDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Episode Alert - ${showName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .episode-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 New Episode Alert!</h1>
              <p>Don't miss the latest episode of your favorite show</p>
            </div>
            
            <div class="content">
              <div class="episode-info">
                <h2>${showName}</h2>
                <h3>Season ${seasonNumber}, Episode ${episodeNumber}</h3>
                <p><strong>${episodeTitle}</strong></p>
                <p><strong>Air Date:</strong> ${airDateFormatted}</p>
              </div>
              
              <p>This is your personalized notification from Flicklet. You can manage your notification preferences in the app settings.</p>
              
              <a href="${process.env.APP_URL || 'https://flicklet.app'}" class="button">Open Flicklet</a>
            </div>
            
            <div class="footer">
              <p>This email was sent because you have email notifications enabled for ${showName}.</p>
              <p>To unsubscribe, update your notification settings in the Flicklet app.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
New Episode Alert - ${showName}

Season ${seasonNumber}, Episode ${episodeNumber}: ${episodeTitle}
Air Date: ${airDateFormatted}

This is your personalized notification from Flicklet. You can manage your notification preferences in the app settings.

Open Flicklet: ${process.env.APP_URL || 'https://flicklet.app'}

---
This email was sent because you have email notifications enabled for ${showName}.
To unsubscribe, update your notification settings in the Flicklet app.
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Flicklet" <${process.env.FROM_EMAIL || 'notifications@flicklet.app'}>`,
      to: email,
      subject: `🎬 New Episode: ${showName} S${seasonNumber}E${episodeNumber}`,
      text: emailText,
      html: emailHtml,
    });

    console.log('Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: info.messageId,
      }),
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send email notification',
        details: error.message,
      }),
    };
  }
};
