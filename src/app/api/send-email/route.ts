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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
