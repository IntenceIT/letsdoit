import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

/**
 * POST /api/send-member-email
 * 
 * Sends an email to a member when their request is approved or rejected.
 * Called from the frontend when an admin clicks Approve/Reject.
 * 
 * Body: {
 *   memberEmail: string       - recipient's email
 *   memberName: string        - recipient's name
 *   adminEmail: string        - the admin who performed the action (sender display)
 *   adminName: string         - admin's display name
 *   action: 'approved' | 'rejected'
 *   appUrl: string            - app URL to include in email
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { memberEmail, memberName, adminEmail, adminName, action, appUrl } = req.body;

  // Basic validation
  if (!memberEmail || !memberName || !action || !['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Gmail sender credentials from env vars
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error('Gmail credentials not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const appLink = appUrl || 'https://letsdoit-tau.vercel.app';
  const isApproved = action === 'approved';

  // Email content
  const subject = isApproved
    ? '🎉 Welcome to Lets Do It — Your Request is Approved!'
    : '❌ Lets Do It — Your Access Request Update';

  const htmlBody = isApproved
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 32px 24px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">You're In!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your access request has been approved</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${memberName}</strong>,</p>
      
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Great news! <strong>${adminName || 'An admin'}</strong> has approved your request to join <strong>Lets Do It</strong>.
        You now have full access to the app.
      </p>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin:0 0 24px;">
        <p style="color:#166534;font-size:14px;margin:0;font-weight:600;">✓ Your account is active</p>
        <p style="color:#16a34a;font-size:13px;margin:6px 0 0;">You can now log in and manage your daily tasks.</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${appLink}"
          style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          Open Lets Do It →
        </a>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        Or copy this link: <a href="${appLink}" style="color:#6366f1;">${appLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        This email was sent by <strong>${adminName || adminEmail || 'Admin'}</strong> via Lets Do It<br>
        &copy; ${new Date().getFullYear()} Lets Do It. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px 32px 24px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 16px;">
        <span style="font-size:28px;line-height:56px;display:block;">❌</span>
      </div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Access Request Update</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your request was not approved at this time</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${memberName}</strong>,</p>
      
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        We're sorry to inform you that <strong>${adminName || 'An admin'}</strong> was unable to approve your 
        access request to <strong>Lets Do It</strong> at this time.
      </p>

      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:16px;margin:0 0 24px;">
        <p style="color:#991b1b;font-size:14px;margin:0;font-weight:600;">Request Status: Not Approved</p>
        <p style="color:#b91c1c;font-size:13px;margin:6px 0 0;">
          If you believe this is a mistake, please contact your admin directly.
        </p>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
        You may try signing in again with your Google account to re-submit your request, 
        or reach out to the admin team for clarification.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        This email was sent by <strong>${adminName || adminEmail || 'Admin'}</strong> via Lets Do It<br>
        &copy; ${new Date().getFullYear()} Lets Do It. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    // Create transporter using Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"${adminName || 'Lets Do It'} via Lets Do It" <${gmailUser}>`,
      replyTo: adminEmail || gmailUser,
      to: memberEmail,
      subject,
      html: htmlBody,
    });

    console.log(`✅ Email sent to ${memberEmail} — action: ${action} by ${adminName || adminEmail}`);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
