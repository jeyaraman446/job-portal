const nodemailer = require('nodemailer');

/**
 * Generate a cryptographically strong 6-digit numerical OTP string
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Initialize nodemailer transporter based on Gmail or custom SMTP
 */
function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (user && pass) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user, pass },
      });
    }

    // Default to direct Gmail Service
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Enterprise HTML Email Layout Wrapper
 */
function buildHtmlTemplate({ title, subtitle, name, roleBadge, bodyContent, otp, note }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 0; color: #94a3b8; font-size: 14px; }
    .badge { display: inline-block; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-top: 12px; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 14px; color: #0f172a; }
    .lead { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .otp-card { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
    .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; }
    .otp-expiry { font-size: 13px; color: #dc2626; margin-top: 8px; font-weight: 500; }
    .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    .footer a { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💼 Smart Job Portal</h1>
      <p>${subtitle}</p>
      ${roleBadge ? `<div class="badge">${roleBadge}</div>` : ''}
    </div>
    <div class="content">
      <div class="greeting">Hello ${name || 'User'},</div>
      <div class="lead">${bodyContent}</div>

      <div class="otp-card">
        <div class="otp-label">Your One-Time Verification Passcode (OTP)</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱️ Valid for 10 minutes only</div>
      </div>

      <div class="warning-box">
        🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. Our security team will never ask for your verification code. If you did not initiate this request, please ignore this email or update your password immediately.
      </div>

      ${note ? `<p style="font-size: 13px; color: #64748b;">${note}</p>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Smart Job Portal Inc. Enterprise Recruitment & Matching System.</p>
      <p>This is an automated system email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Dispatch Account Verification OTP Email
 */
async function sendVerificationEmail({ to, name, otp, role }) {
  const roleLabel = role === 'hr' ? '🏢 Verified Employer / HR Account' : '👤 Candidate / Job Seeker Account';
  const roleDesc = role === 'hr'
    ? 'Thank you for registering your company hiring account on Smart Job Portal. To activate your employer dashboard and post vacancies, please verify your official work email with the OTP below:'
    : 'Welcome to Smart Job Portal! To complete your candidate profile registration and activate intelligent resume matching, please verify your email address with the OTP below:';

  const html = buildHtmlTemplate({
    title: 'Verify Your Email Address - Smart Job Portal',
    subtitle: 'Official Account Verification',
    name,
    roleBadge: roleLabel,
    bodyContent: roleDesc,
    otp,
    note: 'Enter this 6-digit code on the verification screen to complete your registration.',
  });

  const subject = `🔐 [${otp}] Verify your Smart Job Portal account`;
  return sendMail({ to, subject, html, text: `Your Smart Job Portal verification OTP is ${otp}. Valid for 10 minutes.` });
}

/**
 * Dispatch Password Reset OTP Email
 */
async function sendPasswordResetEmail({ to, name, otp }) {
  const html = buildHtmlTemplate({
    title: 'Reset Your Password - Smart Job Portal',
    subtitle: 'Account Security & Password Recovery',
    name,
    roleBadge: '🔑 Password Recovery',
    bodyContent: 'We received a request to reset the password for your Smart Job Portal account. Use the one-time passcode below to set a new password:',
    otp,
    note: 'If you did not request a password reset, you can safely disregard this email. Your existing credentials remain protected.',
  });

  const subject = `🔑 [${otp}] Smart Job Portal Password Reset Code`;
  return sendMail({ to, subject, html, text: `Your password reset OTP is ${otp}. Valid for 10 minutes.` });
}

/**
 * Core sendMail routine with fallback simulation
 */
async function sendMail({ to, subject, html, text }) {
  const fromName = process.env.FROM_NAME || 'Smart Job Portal Security';
  const fromEmail = process.env.FROM_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER || 'security@smartjobportal.com';
  const from = `"${fromName}" <${fromEmail}>`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({ from, to, subject, text, html });
      console.log(`📧 [GMAIL SENT] Message successfully dispatched to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, mode: 'gmail' };
    } catch (err) {
      console.error(`❌ [GMAIL DELIVERY ERROR] Failed to send email to ${to}: ${err.message}`);
      throw new Error(`Failed to deliver OTP to ${to} via Gmail: ${err.message}. Please check your GMAIL_USER and GMAIL_APP_PASSWORD in server/.env.`);
    }
  }

  // If Gmail / SMTP is not yet configured in server/.env
  console.warn(`\n⚠️ [GMAIL NOT CONFIGURED] Real email cannot be dispatched because GMAIL_USER or GMAIL_APP_PASSWORD is not set in server/.env.`);
  console.log(`======================================================`);
  console.log(`To configure real Gmail dispatch:`);
  console.log(`1. Add GMAIL_USER=your_email@gmail.com to server/.env`);
  console.log(`2. Add GMAIL_APP_PASSWORD=your_16_char_app_password to server/.env`);
  console.log(`(Generate your 16-character password at: https://myaccount.google.com/apppasswords)`);
  console.log(`======================================================\n`);

  return { success: true, mode: 'simulation' };
}

module.exports = {
  generateOtp,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMail,
};
