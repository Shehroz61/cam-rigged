import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CamRigged <noreply@camrigged.com>';

interface OrderEmailData {
  toEmail: string;
  productName: string;
  amount: number | string;
  transactionId: string;
  orderId: string;
  notes?: string;
}

function baseTemplate(content: string, title: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CamRigged</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Premium O/A Level Study Resources</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px;text-align:center;border-top:1px solid #334155;">
            <p style="margin:0;color:#64748b;font-size:12px;">© ${new Date().getFullYear()} CamRigged. All rights reserved.</p>
            <p style="margin:4px 0 0;color:#64748b;font-size:12px;">Questions? Email us at support@camrigged.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderReceivedEmail(data: OrderEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">Order Received! 🎉</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      Hey there! We've received your payment details and your order is now being reviewed by our team.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Product</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">${data.productName}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Amount</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">Rs. ${data.amount}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Transaction ID</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-family:monospace;">${data.transactionId}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:#854d0e;color:#fef08a;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">PENDING REVIEW</span></td></tr>
      </table>
    </div>
    <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">⏱️ Our team verifies payments within <strong style="color:#f1f5f9;">24 hours</strong>. You'll receive another email once your order is approved.</p>
    <p style="margin:0;color:#94a3b8;font-size:14px;">You can check your order status anytime in your <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://camrigged.com'}/dashboard" style="color:#3b82f6;text-decoration:none;font-weight:600;">Dashboard</a>.</p>
  `;
  return resend.emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `✅ Order Received — ${data.productName}`,
    html: baseTemplate(content, 'Order Received'),
  });
}

export async function sendOrderApprovedEmail(data: OrderEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#4ade80;font-size:22px;">Payment Approved! 🎓</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      Great news! Your payment has been verified and your order is now <strong style="color:#4ade80;">approved</strong>. You can now access your content.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Product</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">${data.productName}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Amount Paid</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">Rs. ${data.amount}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:#14532d;color:#4ade80;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">APPROVED</span></td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://camrigged.com'}/dashboard" 
         style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
        📖 Access My Content
      </a>
    </div>
    ${data.notes ? `<p style="margin:24px 0 0;color:#94a3b8;font-size:13px;font-style:italic;">Note from admin: ${data.notes}</p>` : ''}
  `;
  return resend.emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `🎓 Your Order is Approved — ${data.productName}`,
    html: baseTemplate(content, 'Order Approved'),
  });
}

export async function sendOrderRejectedEmail(data: OrderEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#f87171;font-size:22px;">Payment Could Not Be Verified</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      Unfortunately, we were unable to verify your payment for the following order. Please review the details and try again.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Product</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">${data.productName}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Transaction ID</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-family:monospace;">${data.transactionId}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:#450a0a;color:#f87171;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">REJECTED</span></td></tr>
      </table>
    </div>
    ${data.notes ? `
    <div style="background:#450a0a;border:1px solid #7f1d1d;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#fca5a5;font-size:14px;"><strong>Reason:</strong> ${data.notes}</p>
    </div>` : ''}
    <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">If you believe this is a mistake, please contact our support team or resubmit your order with the correct payment details.</p>
    <div style="text-align:center;margin-top:32px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://camrigged.com'}/checkout" 
         style="display:inline-block;background:#1e293b;border:1px solid #334155;color:#f1f5f9;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:12px;">
        🔄 Try Again
      </a>
    </div>
  `;
  return resend.emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `❌ Order Rejected — Action Required`,
    html: baseTemplate(content, 'Order Rejected'),
  });
}

export async function sendWelcomeEmail(toEmail: string) {
  const content = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">Welcome to CamRigged! 🚀</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      You've successfully created your account. Start your journey to straight A*s with our premium O & A Level study resources.
    </p>
    <div style="text-align:center;margin-top:32px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://camrigged.com'}" 
         style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;">
        🛍️ Explore Resources
      </a>
    </div>
  `;
  return resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Welcome to CamRigged — Your Path to A*s Starts Here`,
    html: baseTemplate(content, 'Welcome to CamRigged'),
  });
}
