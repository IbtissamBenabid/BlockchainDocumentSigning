const nodemailer = require('nodemailer');

// Email service for sending authentication-related emails
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration (Gmail, SendGrid, etc.)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      // Development: Use Ethereal Email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }
  }

  async sendEmail({ to, subject, template, data }) {
    try {
      const html = this.generateEmailTemplate(template, data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@versafe.com',
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  generateEmailTemplate(template, data) {
    const templates = {
      verification: this.getVerificationTemplate(data),
      'password-reset': this.getPasswordResetTemplate(data),
      welcome: this.getWelcomeTemplate(data)
    };

    return templates[template] || this.getDefaultTemplate(data);
  }

  getVerificationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VerSafe</h1>
            <p>Secure Document Management</p>
          </div>
          <div class="content">
            <h2>Welcome to VerSafe, ${data.name}!</h2>
            <p>Thank you for registering with VerSafe. To complete your registration and start using our secure document management platform, please verify your email address.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with VerSafe, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VerSafe. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VerSafe</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name},</h2>
            <p>We received a request to reset your password for your VerSafe account.</p>
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
            <p>To reset your password, click the button below:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
            <p>This password reset link will expire in 1 hour for security reasons.</p>
            <p>For your security, this link can only be used once.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VerSafe. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #059669; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to VerSafe!</h1>
            <p>Your account is now verified and ready to use</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name},</h2>
            <p>Congratulations! Your VerSafe account has been successfully verified. You can now access all features of our secure document management platform.</p>
            
            <h3>What you can do with VerSafe:</h3>
            <div class="feature">
              <strong>🔒 Secure Document Upload</strong><br>
              Upload and store your documents with military-grade encryption
            </div>
            <div class="feature">
              <strong>✍️ Digital Signatures</strong><br>
              Sign documents electronically with blockchain verification
            </div>
            <div class="feature">
              <strong>🔗 Blockchain Integration</strong><br>
              All documents are recorded on blockchain for immutable proof
            </div>
            <div class="feature">
              <strong>📧 Secure Sharing</strong><br>
              Share documents securely via encrypted email links
            </div>
            
            <p>Ready to get started? Log in to your account and upload your first document!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VerSafe. All rights reserved.</p>
            <p>Need help? Contact our support team at support@versafe.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getDefaultTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>VerSafe Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VerSafe</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have received this notification from VerSafe.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VerSafe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = {
  sendEmail: emailService.sendEmail.bind(emailService)
};
