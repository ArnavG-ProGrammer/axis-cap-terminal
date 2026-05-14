import { Resend } from 'resend';

export async function sendAdminEmail(subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Skipping admin email:", subject);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'AXIS CAP Terminal <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'admin@axiscap.com',
      subject: `[AXIS CAP SYSTEM] ${subject}`,
      text: text,
    });
  } catch (error) {
    console.error("Failed to send admin email:", error);
  }
}
