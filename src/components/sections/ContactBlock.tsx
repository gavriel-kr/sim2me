import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/app/[locale]/contact/ContactForm';
import { EmailCopyButton } from '@/app/[locale]/contact/EmailCopyButton';
import { Mail, Clock, HelpCircle, Smartphone, Wifi, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { brandConfig } from '@/config/brand';

const issueTypes = [
  { key: 'issueInstall', icon: Smartphone },
  { key: 'issueActivation', icon: Wifi },
  { key: 'issueConnectivity', icon: AlertCircle },
  { key: 'issueRefund', icon: RefreshCw },
  { key: 'issueOther', icon: HelpCircle },
] as const;

interface ContactBlockProps {
  /**
   * Set on the help centre, where the "check the help centre first" tip would be telling the reader to
   * go to the page they are already on.
   */
  onHelpPage?: boolean;
}

/**
 * The support information and the message form, extracted from `/[locale]/contact` so the help centre
 * can carry the same thing at the foot of the page.
 *
 * One component rather than two copies on purpose: a contact form duplicated is a form where one copy
 * quietly stops matching the API it posts to. `/[locale]/contact` still exists and still renders this,
 * so nothing that links to it breaks — it is only out of the header menu.
 */
export async function ContactBlock({ onHelpPage = false }: ContactBlockProps) {
  const t = await getTranslations('contact');

  // Support address: the site setting wins, the brand config is the fallback.
  let email = brandConfig.supportEmail;
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ['support_email'] } },
    });
    for (const s of settings) {
      if (s.key === 'support_email' && s.value) email = s.value;
    }
  } catch { /* use defaults */ }

  const tips = (['beforeTip1', 'beforeTip2', 'beforeTip3'] as const).filter(
    (tip) => !(onHelpPage && tip === 'beforeTip1')
  );

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Info cards */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        {/* Support info */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-bold text-foreground">{t('supportTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('supportDesc')}</p>
        </div>

        {/* Email */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">{t('emailLabel')}</h3>
          <EmailCopyButton email={email} />
        </div>

        {/* What happens after you write in */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Clock className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('responseTime')}</p>
        </div>

        {/* Before contacting tips */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-amber-900 text-sm">{t('beforeContact')}</h3>
          </div>
          <ul className="space-y-2 text-xs text-amber-800/80">
            {tips.map((tip) => (
              <li key={tip}>• {t(tip)}</li>
            ))}
          </ul>
        </div>

        {/* Issue types */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground text-sm mb-3">{t('issueTypes')}</h3>
          <div className="flex flex-wrap gap-2">
            {issueTypes.map(({ key, icon: Icon }) => (
              <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                <Icon className="h-3 w-3" />
                {t(key)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-3">
        <h2 className="text-xl font-bold text-foreground">{t('send')}</h2>
        <ContactForm />
      </div>
    </div>
  );
}
