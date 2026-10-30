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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset Your Password — Eco Space</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f6f3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1c201e;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f7f6f3;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e4de;
      border-radius: 16px;
      padding: 0;
      box-sizing: border-box;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 16px 36px -4px rgba(28, 32, 30, 0.08);
      overflow: hidden;
    }
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #1f6f52 0%, #34d399 50%, #1f6f52 100%);
    }
    .card-body {
      padding: 36px 36px 28px 36px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #efefea;
    }
    .logo-badge {
      display: inline-block;
      width: 38px;
      height: 38px;
      line-height: 38px;
      background-color: #1c201e;
      border-radius: 10px;
      text-align: center;
      vertical-align: middle;
    }
    .brand-title {
      font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 400;
      color: #1c201e;
      line-height: 1.1;
      margin: 0;
      text-decoration: none;
    }
    .brand-subtitle {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #1f6f52;
      margin-top: 2px;
      line-height: 1;
    }
    .pill {
      display: inline-block;
      background-color: #edf5f1;
      border: 1px solid #d1e7dc;
      color: #1f6f52;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
    }
    h1 {
      font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif;
      font-size: 32px;
      font-weight: 400;
      color: #1c201e;
      margin: 0 0 14px 0;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    p {
      font-size: 15px;
      color: #4a524d;
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    .button-container {
      margin: 30px 0 26px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #1f6f52;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 13px 34px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(31, 111, 82, 0.28);
      letter-spacing: -0.01em;
    }
    .code-box {
      background-color: #f8f7f4;
      border: 1px solid #e5e4de;
      border-radius: 12px;
      padding: 18px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-weight: 700;
      color: #1f6f52;
      margin-bottom: 8px;
    }
    .code-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 19px;
      font-weight: 700;
      color: #1c201e;
      letter-spacing: 1.5px;
      word-break: break-all;
    }
    .notice-card {
      background-color: #faf9f6;
      border-left: 3px solid #1f6f52;
      padding: 12px 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .notice-card p {
      font-size: 13px;
      color: #4a524d;
      margin: 0;
      line-height: 1.5;
    }
    .link-fallback {
      font-size: 12px;
      color: #7a827c;
      word-break: break-all;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid #efefea;
      line-height: 1.5;
    }
    .link-fallback a {
      color: #1f6f52;
      text-decoration: underline;
    }
    .card-footer {
      background-color: #faf9f6;
      border-top: 1px solid #e5e4de;
      padding: 24px 36px;
      text-align: center;
    }
    .quote {
      font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif;
      font-size: 20px;
      font-style: italic;
      color: #1c201e;
      margin: 0 0 4px 0;
      line-height: 1.3;
    }
    .footer-sub {
      font-size: 12px;
      color: #7a827c;
      margin: 0 0 10px 0;
    }
    .copyright {
      font-size: 11px;
      color: #9ea6a0;
      margin: 0;
    }
    @media (max-width: 600px) {
      .card-body {
        padding: 24px 20px 20px 20px;
      }
      .card-footer {
        padding: 20px 20px;
      }
      h1 {
        font-size: 27px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="accent-bar"></div>
      
      <div class="card-body">
        <table class="header-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="left" style="vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <div class="logo-badge">
                      <!-- Leaf Icon (matching website Lucide Leaf) -->
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                      </svg>
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <div class="brand-title">Eco Space</div>
                    <div class="brand-subtitle">Study packs</div>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" style="vertical-align: middle;">
              <span class="pill">&#8226; Security</span>
            </td>
          </tr>
        </table>

        <h1>Reset your password</h1>
        <p>${greeting}</p>
        <p>We received a request to reset the password for your <strong>Eco Space</strong> account. Click the button below to choose a new password:</p>

        <div class="button-container">
          <a href="${resetUrl}" target="_blank" class="btn">Reset password</a>
        </div>

        <div class="code-box">
          <div class="code-label">Or enter this reset code directly</div>
          <div class="code-value">${resetToken}</div>
        </div>

        <div class="notice-card">
          <p>
            &#9201; <strong>This reset link is valid for 1 hour.</strong><br>
            If you did not request this reset, you can safely ignore this email — your current password remains secure and your account is protected.
          </p>
        </div>

        <div class="link-fallback">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </div>
      </div>

      <div class="card-footer">
        <p class="quote">&ldquo;Less searching, more understanding.&rdquo;</p>
        <p class="footer-sub">Organized, high-yield study packs for Algerian engineering & management schools.</p>
        <p class="copyright">&copy; ${new Date().getFullYear()} Eco Space. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
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
