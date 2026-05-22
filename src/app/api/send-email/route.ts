import { NextRequest, NextResponse } from 'next/server';
import {
  sendOrderReceivedEmail,
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
  sendWelcomeEmail,
} from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing email type' }, { status: 400 });
    }

    // Validate email data to prevent injection
    if (data.toEmail && typeof data.toEmail === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.toEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Rate limiting check (simple in-memory - consider Redis for production)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // Store request timestamps in a Map (reset on server restart)
    if (!(global as any).emailRequestLog) {
      (global as any).emailRequestLog = new Map();
    }
    
    const ipLog = (global as any).emailRequestLog.get(clientIp) || [];
    const recentRequests = ipLog.filter((timestamp: number) => now - timestamp < 60000); // Last 60 seconds
    
    if (recentRequests.length >= 10) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }
    
    recentRequests.push(now);
    (global as any).emailRequestLog.set(clientIp, recentRequests);

    let result;
    switch (type) {
      case 'order_received':
        result = await sendOrderReceivedEmail(data);
        break;
      case 'order_approved':
        result = await sendOrderApprovedEmail(data);
        break;
      case 'order_rejected':
        result = await sendOrderRejectedEmail(data);
        break;
      case 'welcome':
        result = await sendWelcomeEmail(data.toEmail);
        break;
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}