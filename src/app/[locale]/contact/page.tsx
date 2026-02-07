import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactForm } from './ContactForm';
import { Mail, MessageSquare, Clock } from 'lucide-react';

export async function generateMetadata() {
  const t = await getTranslations('contact');
  return { title: t('title'), description: 'Get in touch with our support team.' };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');

  return (
    <MainLayout>
      <section className="bg-gradient-to-b from-primary/[0.06] to-white py-16 sm:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t('title')}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            {/* Info cards */}
            <div className="flex flex-col gap-5 lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Email</h3>
                <a href="mailto:support@sim2me.com" className="mt-1 block text-sm text-primary hover:underline">
                  support@sim2me.com
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">WhatsApp</h3>
                <a
                  href="https://wa.me/972501234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-primary hover:underline"
                >
                  Chat with us
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">24/7 Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">We typically respond within 1 hour</p>
              </div>
            </div>

            {/* Contact form */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-3">
              <h2 className="text-xl font-bold text-foreground">Send us a message</h2>
              <p className="mt-1 text-sm text-muted-foreground">We&apos;ll get back to you as soon as possible.</p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
