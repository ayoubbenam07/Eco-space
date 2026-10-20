import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let transporterInstance = null;

/**
 * Returns a configured Nodemailer transporter or null if SMTP is not configured.
 */
export function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const smtpHost = process.env.SMTP_HOST || env.smtpHost;
  const smtpPort = parseInt(process.env.SMTP_PORT || env.smtpPort, 10) || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465' || env.smtpSecure;
  const smtpUser = process.env.SMTP_USER || env.smtpUser;
  const smtpPass = process.env.SMTP_PASS || env.smtpPass;
  const smtpService = process.env.SMTP_SERVICE || env.smtpService;

  // If no SMTP host/service or credentials configured, return null
  if ((!smtpHost && !smtpService) || !smtpUser || !smtpPass) {
    return null;
  }

  const options = {};

  if (smtpService) {
    options.service = smtpService;
    options.auth = {
      user: smtpUser,
      pass: smtpPass,
    };
  } else {
    options.host = smtpHost;
    options.port = smtpPort;
    options.secure = smtpSecure;
    options.auth = {
      user: smtpUser,
      pass: smtpPass,
    };
  }

  // Timeouts to prevent requests from hanging indefinitely
  options.connectionTimeout = 10000; // 10s
  options.greetingTimeout = 10000;   // 10s
  options.socketTimeout = 15000;     // 15s

  // In non-production, tolerate self-signed certs if testing custom relays
  if (!env.isProduction) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  try {
    transporterInstance = nodemailer.createTransport(options);
    return transporterInstance;
  } catch (err) {
    logger.error(`[EmailService] Failed to create transport: ${err.message}`);
    return null;
  }
}

/**
 * Generates modern HTML template for password reset email.
 */
function generatePasswordResetHtml({ fullName, resetUrl, resetToken }) {
  const greeting = fullName ? `Hello ${fullName},` : 'Hello,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — Eco Space</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 36px 32px;
      box-sizing: border-box;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .header {
      margin-bottom: 28px;
      border-bottom: 1px solid #1f2937;
      padding-bottom: 20px;
    }
    .brand {
      display: inline-block;
      font-size: 22px;
      font-weight: 700;
      color: #10b981;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .brand span {
      color: #f9fafb;
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-left: 8px;
      vertical-align: middle;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #f9fafb;
      margin: 0 0 16px 0;
    }
    p {
      font-size: 15px;
      color: #94a3b8;
      margin: 0 0 16px 0;
    }
    .button-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      transition: background-color 0.2s ease;
    }
    .code-box {
      background-color: #0f172a;
      border: 1px dashed #334155;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .code-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 600;
      color: #38bdf8;
      letter-spacing: 1px;
      word-break: break-all;
    }
    .link-fallback {
      font-size: 13px;
      color: #64748b;
      word-break: break-all;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #1f2937;
    }
    .link-fallback a {
      color: #10b981;
      text-decoration: underline;
    }
    .footer {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="brand">Eco<span>Space</span></a>
        <span class="badge">Security</span>
      </div>

      <h1>Password Reset Request</h1>
      <p>${greeting}</p>
      <p>We received a request to reset your password for your <strong>Eco Space</strong> account. Click the button below to set a new password:</p>

      <div class="button-container">
        <a href="${resetUrl}" target="_blank" class="btn">Reset My Password</a>
      </div>

      <div class="code-box">
        <div class="code-label">Or use your reset token / code directly:</div>
        <div class="code-value">${resetToken}</div>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">
        ⏱️ <strong>This reset link is valid for 1 hour.</strong>
      </p>
      <p style="font-size: 13px; color: #94a3b8;">
        If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged and your account is secure.
      </p>

      <div class="link-fallback">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Eco Space. Higher Schools of Economics & Management.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends a password reset email to a user.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} [params.fullName] - User's full name for personalization
 * @param {string} params.resetToken - The raw reset token to include in the link
 * @returns {Promise<{ sent: boolean, reason?: string, messageId?: string, resetUrl?: string }>}
 */
export async function sendPasswordResetEmail({ to, fullName, resetToken }) {
  // Strip trailing slashes and take the primary origin if multiple
  const frontendOrigin = (env.frontendUrl || 'http://localhost:3000').split(',')[0].trim().replace(/\/+$/, '');
  const resetUrl = `${frontendOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const transporter = getTransporter();

  // If SMTP is not configured, log clearly so development/testing continues seamlessly
  if (!transporter) {
    logger.warn(`[EmailService] SMTP not configured. Password reset link for ${to}:\n  🔗 ${resetUrl}`);
    return {
      sent: false,
      reason: 'SMTP is not configured in environment variables (SMTP_HOST/SMTP_USER).',
      resetUrl,
    };
  }

  const mailOptions = {
    from: env.smtpFrom,
    to,
    subject: 'Reset your Eco Space password',
    text: `Hello ${fullName || 'there'},\n\nWe received a request to reset your password for your Eco Space account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nAlternatively, your reset code is:\n${resetToken}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nThe Eco Space Team`,
    html: generatePasswordResetHtml({ fullName, resetUrl, resetToken }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EmailService] Password reset email successfully sent to ${to} (Message-ID: ${info.messageId})`);
    return {
      sent: true,
      messageId: info.messageId,
      resetUrl,
    };
  } catch (error) {
    logger.error(`[EmailService] Failed to send password reset email to ${to}: ${error.message}`);
    throw error;
  }
}

/**
 * Verifies SMTP server connectivity.
 */
export async function verifyEmailConfig() {
  const transporter = getTransporter();
  if (!transporter) {
    logger.info('[EmailService] SMTP is not configured. Password reset links will be logged to console in non-production.');
    return { configured: false, connected: false };
  }

  try {
    await transporter.verify();
    logger.info('[EmailService] SMTP server connection verified successfully.');
    return { configured: true, connected: true };
  } catch (error) {
    logger.warn(`[EmailService] SMTP verification failed: ${error.message}`);
    return { configured: true, connected: false, error: error.message };
  }
}
