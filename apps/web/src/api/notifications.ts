// Client API utility for notification functions
// Handles communication with Netlify functions

export interface SendTestEmailResponse {
  ok: boolean;
  status?: string;
  details?: string;
}

export interface SendTestEmailRequest {
  to: string;
  templateId: string;
  dynamicTemplateData: {
    userName: string;
    message: string;
  };
  subject: string;
}

/**
 * Send a test email via Netlify function
 * @param to - Email address to send test email to
 * @throws Error if request fails or returns non-202 status
 */
export async function sendTestEmail(to: string): Promise<void> {
  const requestBody: SendTestEmailRequest = {
    to,
    templateId: 'd-22144b9bf8d74fe0bec75f0a430ede9a',
    dynamicTemplateData: {
      userName: 'Flicklet User',
      message: 'This is a test notification email.'
    },
    subject: 'Flicklet test'
  };

  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 202) {
      const result: SendTestEmailResponse = await response.json();
      if (result.ok) {
        return; // Success
      } else {
        throw new Error(`Email service error: ${result.status || 'Unknown error'}`);
      }
    } else {
      // Parse error response
      let errorDetails = `HTTP ${response.status}`;
      try {
        const errorResponse = await response.json();
        errorDetails = `${errorResponse.status || response.statusText} - ${errorResponse.details || 'Unknown error'}`;
      } catch {
        errorDetails = `HTTP ${response.status} - ${response.statusText}`;
      }
      throw new Error(errorDetails);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred while sending test email');
  }
}










