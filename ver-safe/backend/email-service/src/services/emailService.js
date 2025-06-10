const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * Email Service for sending various types of emails
 * Supports Gmail API, SMTP, and template-based emails
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.GMAIL_CLIENT_ID) {
        // Use Gmail API in production
        const { google } = require('googleapis');
        
        const oauth2Client = new google.auth.OAuth2(
          process.env.GMAIL_CLIENT_ID,
          process.env.GMAIL_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const accessToken = await oauth2Client.getAccessToken();

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_FROM,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken.token,
          },
        });
      } else {
        // Use SMTP for development/testing
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.ethereal.email',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
            pass: process.env.SMTP_PASS || 'ethereal.pass'
          }
        });
      }

      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  async sendEmail({ emailId, to, subject, template, data = {}, attachments = [] }) {
    try {
      let html;
      
      if (template) {
        html = await this.renderTemplate(template, data);
      } else {
        html = data.html || data.content || 'No content provided';
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@versafe.com',
        to,
        subject,
        html,
        attachments: await this.processAttachments(attachments)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully: ${result.messageId}`);
      return { 
        success: true, 
        messageId: result.messageId,
        emailId 
      };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      return { 
        success: false, 
        error: error.message,
        emailId 
      };
    }
  }

  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../../templates', `${templateName}.hbs`);
      
      if (!fs.existsSync(templatePath)) {
        // Return default template if specific template not found
        return this.getDefaultTemplate(templateName, data);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      
      return template(data);
    } catch (error) {
      console.error('Template rendering error:', error);
      return this.getDefaultTemplate(templateName, data);
    }
  }

  async processAttachments(attachments) {
    const processedAttachments = [];

    for (const attachment of attachments) {
      if (attachment.type === 'qr-code') {
        // Generate QR code attachment
        const qrCodeBuffer = await QRCode.toBuffer(attachment.data);
        processedAttachments.push({
          filename: attachment.filename || 'qrcode.png',
          content: qrCodeBuffer,
          contentType: 'image/png'
        });
      } else if (attachment.path) {
        // File attachment
        processedAttachments.push({
          filename: attachment.filename,
          path: attachment.path,
          contentType: attachment.contentType
        });
      } else if (attachment.content) {
        // Buffer/string attachment
        processedAttachments.push({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType
        });
      }
    }

    return processedAttachments;
  }

  getDefaultTemplate(templateName, data) {
    const templates = {
      'document-share': this.getDocumentShareTemplate(data),
      'signature-request': this.getSignatureRequestTemplate(data),
      'document-signed': this.getDocumentSignedTemplate(data),
      'welcome': this.getWelcomeTemplate(data),
      'password-reset': this.getPasswordResetTemplate(data),
      'verification': this.getVerificationTemplate(data)
    };

    return templates[templateName] || this.getGenericTemplate(data);
  }

  getDocumentShareTemplate(data) {
    const { senderName, documentTitle, shareUrl, accessLevel, message, expiryDate } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Shared - VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9fa; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .access-level { background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Document Shared</h1>
            <p>VerSafe - Secure Document Management</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p><strong>${senderName}</strong> has shared a document with you on VerSafe.</p>
            
            <div class="access-level">
              <strong>Document:</strong> ${documentTitle}<br>
              <strong>Access Level:</strong> ${accessLevel}
              ${expiryDate ? `<br><strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString()}` : ''}
            </div>
            
            ${message ? `<p><strong>Personal Message:</strong><br><em>"${message}"</em></p>` : ''}
            
            <p>Click the button below to access the document:</p>
            <a href="${shareUrl}" class="button">View Document</a>
            
            <p>If the button doesn't work, copy and paste this link:</p>
            <p><a href="${shareUrl}">${shareUrl}</a></p>
            
            <p><strong>Security Notice:</strong> This link is secure and can only be accessed by you. Do not share this link with others.</p>
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

  getSignatureRequestTemplate(data) {
    const { requesterName, documentTitle, signatureUrl, message, dueDate } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Signature Request - VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9fa; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .urgent { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✍️ Signature Required</h1>
            <p>VerSafe - Digital Signature Platform</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p><strong>${requesterName}</strong> has requested your signature on a document.</p>
            
            <div class="urgent">
              <strong>Document:</strong> ${documentTitle}
              ${dueDate ? `<br><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}` : ''}
            </div>
            
            ${message ? `<p><strong>Message from ${requesterName}:</strong><br><em>"${message}"</em></p>` : ''}
            
            <p>Please review and sign the document by clicking the button below:</p>
            <a href="${signatureUrl}" class="button">Review & Sign Document</a>
            
            <p>If the button doesn't work, copy and paste this link:</p>
            <p><a href="${signatureUrl}">${signatureUrl}</a></p>
            
            <p><strong>Important:</strong> Your digital signature will be legally binding. Please review the document carefully before signing.</p>
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

  getDocumentSignedTemplate(data) {
    const { signerEmail, documentTitle, documentUrl, signedAt } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Signed - VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9fa; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .success { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Document Signed</h1>
            <p>VerSafe - Digital Signature Platform</p>
          </div>
          <div class="content">
            <h2>Great News!</h2>
            <p>Your document has been successfully signed.</p>
            
            <div class="success">
              <strong>Document:</strong> ${documentTitle}<br>
              <strong>Signed by:</strong> ${signerEmail}<br>
              <strong>Signed at:</strong> ${new Date(signedAt).toLocaleString()}
            </div>
            
            <p>The document is now complete and has been secured with blockchain verification.</p>
            
            <p>You can view the signed document by clicking the button below:</p>
            <a href="${documentUrl}" class="button">View Signed Document</a>
            
            <p><strong>Security:</strong> This signature is cryptographically secured and recorded on the blockchain for immutable proof.</p>
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
    const { userName, verificationUrl } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9fa; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to VerSafe!</h1>
            <p>Secure Document Management Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Welcome to VerSafe! We're excited to have you join our secure document management platform.</p>
            
            ${verificationUrl ? `
              <p>To get started, please verify your email address:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            ` : ''}
            
            <h3>What you can do with VerSafe:</h3>
            <div class="feature">
              <strong>🔒 Secure Document Storage</strong><br>
              Upload and store documents with military-grade encryption
            </div>
            <div class="feature">
              <strong>✍️ Digital Signatures</strong><br>
              Sign documents electronically with blockchain verification
            </div>
            <div class="feature">
              <strong>🔗 Blockchain Security</strong><br>
              All documents are secured with immutable blockchain records
            </div>
            <div class="feature">
              <strong>📧 Secure Sharing</strong><br>
              Share documents securely with controlled access levels
            </div>
            
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VerSafe. All rights reserved.</p>
            <p>Need help? Contact support@versafe.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(data) {
    const { userName, resetUrl } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - VerSafe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9fa; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Password Reset</h1>
            <p>VerSafe - Account Security</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your VerSafe account.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>To reset your password, click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>If the button doesn't work, copy and paste this link:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p>This password reset link will expire in 1 hour for security reasons.</p>
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

  getVerificationTemplate(data) {
    const { userName, verificationUrl } = data;
    
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
          .content { padding: 20px; background: #f9f9fa; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify Your Email</h1>
            <p>VerSafe - Account Verification</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for registering with VerSafe. To complete your registration, please verify your email address.</p>
            
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            
            <p>If the button doesn't work, copy and paste this link:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p>This verification link will expire in 24 hours for security reasons.</p>
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

  getGenericTemplate(data) {
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
          .content { padding: 20px; background: #f9f9fa; }
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
            <p>Hello,</p>
            <p>You have received this notification from VerSafe.</p>
            ${data.content || '<p>No additional content provided.</p>'}
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

// Create singleton instance
const emailService = new EmailService();

// Export specific email functions
async function sendDocumentShareEmail(data) {
  const shareUrl = `${process.env.FRONTEND_URL}/shared/${data.shareToken}`;
  
  return await emailService.sendEmail({
    to: data.recipientEmail,
    subject: `${data.senderName} shared a document with you - ${data.documentTitle}`,
    template: 'document-share',
    data: { ...data, shareUrl }
  });
}

async function sendSignatureRequestEmail(data) {
  const signatureUrl = `${process.env.FRONTEND_URL}/sign/${data.requestToken}`;
  
  return await emailService.sendEmail({
    to: data.signerEmail,
    subject: `Signature Required: ${data.documentTitle}`,
    template: 'signature-request',
    data: { ...data, signatureUrl }
  });
}

async function sendDocumentSignedEmail(data) {
  const documentUrl = `${process.env.FRONTEND_URL}/documents/${data.documentId}`;
  
  return await emailService.sendEmail({
    to: data.ownerEmail,
    subject: `Document Signed: ${data.documentTitle}`,
    template: 'document-signed',
    data: { ...data, documentUrl }
  });
}

async function sendWelcomeEmail(data) {
  const verificationUrl = data.verificationToken ? 
    `${process.env.FRONTEND_URL}/verify-email?token=${data.verificationToken}` : null;
  
  return await emailService.sendEmail({
    to: data.userEmail,
    subject: 'Welcome to VerSafe - Secure Document Management',
    template: 'welcome',
    data: { ...data, verificationUrl }
  });
}

async function sendPasswordResetEmail(data) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}`;
  
  return await emailService.sendEmail({
    to: data.userEmail,
    subject: 'Reset Your VerSafe Password',
    template: 'password-reset',
    data: { ...data, resetUrl }
  });
}

module.exports = {
  sendEmail: emailService.sendEmail.bind(emailService),
  sendDocumentShareEmail,
  sendSignatureRequestEmail,
  sendDocumentSignedEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
