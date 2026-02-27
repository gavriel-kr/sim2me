'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Send, CheckCircle } from 'lucide-react';

export function ContactForm() {
  const t = useTranslations('contact');
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      toast({
        title: 'Message sent!',
        description: "We'll get back to you soon.",
        variant: 'success',
      });
      reset();
    } catch {
      toast({
        title: 'Error',
        description: 'Could not send message. Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 flex flex-col items-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{t('messageSent')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('messageSentDesc')}</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">{t('name')}</Label>
          <Input
            id="name"
            className="mt-1.5 h-11 rounded-xl"
            placeholder={t('namePlaceholder')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="contact-name-error" className="mt-1 text-sm text-destructive" role="alert">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            className="mt-1.5 h-11 rounded-xl"
            placeholder={t('emailPlaceholder')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-1 text-sm text-destructive" role="alert">{errors.email.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="subject" className="text-sm font-medium">{t('subject')}</Label>
        <Input
          id="subject"
          className="mt-1.5 h-11 rounded-xl"
          placeholder={t('subjectPlaceholder')}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
          {...register('subject')}
        />
        {errors.subject && (
          <p id="contact-subject-error" className="mt-1 text-sm text-destructive" role="alert">{errors.subject.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="message" className="text-sm font-medium">{t('message')}</Label>
        <textarea
          id="message"
          rows={5}
          className="mt-1.5 flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder={t('messagePlaceholder')}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          {...register('message')}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-sm text-destructive" role="alert">{errors.message.message}</p>
        )}
      </div>
      <div className="flex items-start gap-3">
        <input
          id="marketingConsent"
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          {...register('marketingConsent')}
        />
        <Label htmlFor="marketingConsent" className="text-sm text-muted-foreground cursor-pointer leading-snug">
          {t('marketingConsent')}
        </Label>
      </div>
      <Button
        type="submit"
        disabled={sending}
        className="h-12 w-full rounded-xl text-base font-semibold shadow-md"
      >
        {sending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t('sending')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t('send')}
          </span>
        )}
      </Button>
    </form>
  );
}
