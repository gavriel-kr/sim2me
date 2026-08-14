import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { contactFormSchema } from '@/lib/validation/schemas';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
// import { checkBotId } from 'botid/server'; // BotID disabled
import { verifyTurnstile } from '@/lib/turnstile';
import { contactRef } from '@/lib/contactRef';
import { sendContactAutoReplyEmail, sendContactAdminNotificationEmail, toEmailLocale } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Ticket 026. Subjects where someone is likely standing in an airport with no connection. They change
 * the notification subject line only — nothing about how the submission is stored or answered.
 */
const URGENT_SUBJECTS = new Set(['Activation Issue', 'Connectivity Problem']);

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(ip, 'contact', 3, 60);
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

    const body = await request.json();

    // Turnstile verification
    const turnstileOk = await verifyTurnstile(body?.turnstileToken ?? '', ip);
    if (!turnstileOk) {
      return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400 });
    }

    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message, marketingConsent } = parsed.data;
    const locale = toEmailLocale(body?.locale);

    // The database write is the only step allowed to fail the request: a stored message can always be
    // answered by hand, an unstored one is gone.
    const submission = await prisma.contactSubmission.create({
      data: { name, email, phone: phone ?? null, subject, message, marketingConsent: marketingConsent ?? false },
    });
    const ref = contactRef(submission.id);

    /* A mail provider having a bad afternoon must not turn a message we have already stored into an
       error on the customer's screen, so a refused send is still a successful submission. `sendEmail`
       logs its own failures and returns early with a log line when there is no API key locally.

       Ticket 039: started here but joined before the response rather than left detached, because a
       detached send is suspended the moment the instance freezes — which turned "we emailed you a
       copy" into a promise we kept several minutes later, or not at all. */
    const adminNotified = sendContactAdminNotificationEmail({
      name,
      email,
      phone: phone ?? null,
      subject,
      message,
      ref,
      urgent: URGENT_SUBJECTS.has(subject),
      marketingConsent: marketingConsent ?? false,
    }).catch((e) => {
      console.error('[Contact] Admin notification failed (non-fatal)', e);
      return false;
    });

    /* The auto-reply is the one thing this endpoint sends to an address a stranger chose, so it is
       limited per address as well as per IP: three a day means someone cannot use the form to post
       our branded mail into a person's inbox over and over from changing addresses. The submission is
       still stored and still notified — only the courtesy copy is withheld. The key is a hash so the
       rate-limit table does not accumulate email addresses. */
    const recipientKey = createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
    const autoReplyAllowed = await checkRateLimit(recipientKey, 'contact-autoreply', 3, 86400);
    const autoReplied = autoReplyAllowed
      ? sendContactAutoReplyEmail(email, { customerName: name, ref, subject }, locale)
          .catch((e) => {
            console.error('[Contact] Auto-reply failed (non-fatal)', e);
            return false;
          })
      : Promise.resolve(false);
    if (!autoReplyAllowed) {
      console.warn(`[Contact] Auto-reply suppressed for ${ref}: recipient limit reached`);
    }

    // Both sends overlap each other; this is the point where the handler stops before the freeze.
    const [adminOk, replyOk] = await Promise.all([adminNotified, autoReplied]);
    if (!adminOk) console.error('[Contact] Admin notification was not accepted', { ref });
    if (autoReplyAllowed && !replyOk) console.error('[Contact] Auto-reply was not accepted', { ref });

    return NextResponse.json({ success: true, ref });
  } catch (error) {
    console.error('[Contact API Error]', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
