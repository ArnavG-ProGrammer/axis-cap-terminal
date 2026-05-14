import { NextResponse } from 'next/server';
import { sendAdminEmail } from '@/lib/sendAdminEmail';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, subject, message } = body;

    if (!email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendAdminEmail(
      `Support Ticket: ${subject || 'General Inquiry'}`,
      `User Email: ${email}\n\nMessage:\n${message}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support API Error:', error);
    return NextResponse.json({ error: 'Failed to submit support ticket' }, { status: 500 });
  }
}
