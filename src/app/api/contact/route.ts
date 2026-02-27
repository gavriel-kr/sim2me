import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation/schemas';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message, marketingConsent } = parsed.data;

    // Always save to DB regardless of email config
    await prisma.contactSubmission.create({
      data: { name, email, phone: phone ?? null, subject, message, marketingConsent: marketingConsent ?? false },
    });

    if (!process.env.RESEND_API_KEY) {
      console.log('[Contact Form] No RESEND_API_KEY set — logging instead:');
      console.log({ name, email, subject, message });
      return NextResponse.json({ success: true, dev: true });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `Sim2Me Contact <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: ['gavriel.kr@gmail.com'],
      replyTo: email,
      subject: `[Sim2Me Contact] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9668;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 100px;">Name:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Subject:</td>
              <td style="padding: 8px 0;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">
            This message was sent from the Sim2Me contact form.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact API Error]', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
