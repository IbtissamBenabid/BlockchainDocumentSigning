const { google } = require('googleapis');

class GmailService {
  constructor() {
    this.oauth2Client = null;
    this.gmail = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Check if Gmail credentials are provided
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
        console.log('Gmail credentials not provided, skipping Gmail service initialization');
        return false;
      }

      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob' // For installed applications
      );

      // Set refresh token if available
      if (process.env.GMAIL_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        // Initialize Gmail API
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        this.initialized = true;
        
        console.log('✅ Gmail service initialized successfully');
        return true;
      } else {
        console.log('Gmail refresh token not provided, Gmail service not fully initialized');
        return false;
      }

    } catch (error) {
      console.error('Failed to initialize Gmail service:', error.message);
      return false;
    }
  }

  async sendEmail({ to, subject, htmlContent, textContent, attachments = [] }) {
    if (!this.initialized) {
      throw new Error('Gmail service not initialized');
    }

    try {
      // Create email message
      const message = this.createEmailMessage({
        to,
        subject,
        htmlContent,
        textContent,
        attachments
      });

      // Send email
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      return {
        success: true,
        messageId: result.data.id,
        threadId: result.data.threadId
      };

    } catch (error) {
      console.error('Gmail send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  createEmailMessage({ to, subject, htmlContent, textContent, attachments = [] }) {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    
    let message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="alt_${boundary}"`,
      '',
      `--alt_${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      '',
      textContent || this.htmlToText(htmlContent),
      '',
      `--alt_${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      '',
      htmlContent,
      '',
      `--alt_${boundary}--`
    ];

    // Add attachments if any
    attachments.forEach(attachment => {
      message.push(
        `--${boundary}`,
        `Content-Type: ${attachment.contentType}`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        '',
        attachment.content,
        ''
      );
    });

    message.push(`--${boundary}--`);

    return Buffer.from(message.join('\n')).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  htmlToText(html) {
    if (!html) return '';
    
    // Simple HTML to text conversion
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async getProfile() {
    if (!this.initialized) {
      throw new Error('Gmail service not initialized');
    }

    try {
      const result = await this.gmail.users.getProfile({
        userId: 'me'
      });

      return {
        success: true,
        profile: result.data
      };

    } catch (error) {
      console.error('Get Gmail profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listMessages({ query = '', maxResults = 10 } = {}) {
    if (!this.initialized) {
      throw new Error('Gmail service not initialized');
    }

    try {
      const result = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      return {
        success: true,
        messages: result.data.messages || [],
        nextPageToken: result.data.nextPageToken
      };

    } catch (error) {
      console.error('List Gmail messages error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  isInitialized() {
    return this.initialized;
  }
}

// Create singleton instance
const gmailService = new GmailService();

// Initialize Gmail service
async function initializeGmailService() {
  try {
    const initialized = await gmailService.initialize();
    if (initialized) {
      console.log('Gmail service ready for use');
    } else {
      console.log('Gmail service not available (missing credentials)');
    }
    return initialized;
  } catch (error) {
    console.error('Gmail service initialization failed:', error);
    return false;
  }
}

module.exports = {
  gmailService,
  initializeGmailService
};
