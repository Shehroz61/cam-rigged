import { Resend } from 'resend';

// Initialize Resend lazily to avoid build-time errors
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      emails: {
        send: async () => ({ id: 'mock-id' })
      }
    } as any;
  }
  return new Resend(apiKey);
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CamRigged <noreply@camrigged.com>';

interface OrderEmailData {
  toEmail: string;
  productName: string;
  amount: number | string;
  transactionId: string;
  orderId: string;
  notes?: string;
}

function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return '';
  // Remove potentially dangerous characters
  return str
    .replace(/[<>'"]/g, '')
    .substring(0, 500);
}

function baseTemplate(content: string, title: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${sanitizeInput(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CamRigged</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Premium O/A Level Study Resources</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
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
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">Order Received!</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      We have received your payment details and your order is now being reviewed.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Product</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">${sanitizeInput(data.productName)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Amount</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">Rs. ${Number(data.amount).toFixed(2)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Transaction ID</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-family:monospace;">${sanitizeInput(data.transactionId)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:#854d0e;color:#fef08a;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">PENDING REVIEW</span></td></tr>
      </table>
    </div>
    <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">Our team verifies payments within 24 hours.</p>
  `;
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `Order Received - ${sanitizeInput(data.productName)}`,
    html: baseTemplate(content, 'Order Received'),
  });
}

export async function sendOrderApprovedEmail(data: OrderEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#4ade80;font-size:22px;">Payment Approved!</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      Your payment has been verified and your order is approved.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Product</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">${sanitizeInput(data.productName)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Amount Paid</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">Rs. ${Number(data.amount).toFixed(2)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:#14532d;color:#4ade80;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">APPROVED</span></td></tr>
      </table>
    </div>
  `;
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `Order Approved - ${sanitizeInput(data.productName)}`,
    html: baseTemplate(content, 'Order Approved'),
  });
}

export async function sendOrderRejectedEmail(data: OrderEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#f87171;font-size:22px;">Payment Could Not Be Verified</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      We were unable to verify your payment. Please try again.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Product</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-weight:600;">${sanitizeInput(data.productName)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Transaction ID</td><td style="color:#f1f5f9;font-size:13px;text-align:right;font-family:monospace;">${sanitizeInput(data.transactionId)}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:#450a0a;color:#f87171;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">REJECTED</span></td></tr>
      </table>
    </div>
    ${data.notes ? `<div style="background:#450a0a;border:1px solid #7f1d1d;border-radius:12px;padding:16px;margin-bottom:24px;"><p style="margin:0;color:#fca5a5;font-size:14px;"><strong>Reason:</strong> ${sanitizeInput(data.notes)}</p></div>` : ''}
  `;
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: data.toEmail,
    subject: `Order Rejected - Action Required`,
    html: baseTemplate(content, 'Order Rejected'),
  });
}

export async function sendWelcomeEmail(toEmail: string) {
  const content = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">Welcome to CamRigged!</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
      You have successfully created your account.
    </p>
  `;
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Welcome to CamRigged`,
    html: baseTemplate(content, 'Welcome'),
  });
}