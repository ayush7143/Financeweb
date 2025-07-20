const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    secure: true,
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  });
};

const sendResetEmail = async (email, resetToken) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Email configuration missing: EMAIL_USER or EMAIL_APP_PASSWORD not set');
    }

    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL not configured');
    }

    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Finance Web',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset Request - Finance Web',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Finance Web</h1>
              <h2 style="color: #666; font-weight: normal;">Password Reset Request</h2>
            </div>
            
            <p style="color: #666; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #666; margin-bottom: 20px;">
              You requested to reset your password for your Finance Web account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            
            <p style="color: #666; margin-bottom: 10px;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #007bff; word-break: break-all; margin-bottom: 20px;">
              ${resetUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
              <p style="color: #999; font-size: 14px;">
                If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = { 
  sendResetEmail, 
  testEmailConfig 
};
