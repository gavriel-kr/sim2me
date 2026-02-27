'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormData, CONTACT_SUBJECTS } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/PhoneInput';
import { useToast } from '@/hooks/useToast';
import { Send, CheckCircle } from 'lucide-react';

const SUBJECT_KEYS: Record<string, string> = {
  'Installation Help': 'subject_installation_help',
  'Activation Issue': 'subject_activation_issue',
  'Connectivity Problem': 'subject_connectivity_problem',
  'Refund Request': 'subject_refund_request',
  'Billing & Payment': 'subject_billing_payment',
  'General Inquiry': 'subject_general_inquiry',
};

export function ContactForm() {
  const t = useTranslations('contact');
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContactFormData>({
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
      toast({ title: t('messageSent'), description: t('messageSentDesc'), variant: 'success' });
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
      {/* Name + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">{t('name')}</Label>
          <Input
            id="name"
            className="mt-1.5 h-11 rounded-xl"
            placeholder={t('namePlaceholder')}
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive" role="alert">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            className="mt-1.5 h-11 rounded-xl"
            placeholder={t('emailPlaceholder')}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive" role="alert">{errors.email.message}</p>}
        </div>
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          {t('phone')} <span className="text-destructive">*</span>
        </Label>
        <div className="mt-1.5">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="phone"
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? '')}
                placeholder={t('phonePlaceholder')}
              />
            )}
          />
        </div>
        {errors.phone && <p className="mt-1 text-sm text-destructive" role="alert">{errors.phone.message}</p>}
      </div>

      {/* Subject dropdown */}
      <div>
        <Label htmlFor="subject" className="text-sm font-medium">{t('subject')}</Label>
        <select
          id="subject"
          className="mt-1.5 flex h-11 w-full appearance-none rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-invalid={!!errors.subject}
          defaultValue=""
          {...register('subject')}
        >
          <option value="" disabled>{t('subjectPlaceholder')}</option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {t(SUBJECT_KEYS[s] as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
        {errors.subject && <p className="mt-1 text-sm text-destructive" role="alert">{errors.subject.message}</p>}
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="message" className="text-sm font-medium">{t('message')}</Label>
        <textarea
          id="message"
          rows={5}
          className="mt-1.5 flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder={t('messagePlaceholder')}
          aria-invalid={!!errors.message}
          {...register('message')}
        />
        {errors.message && <p className="mt-1 text-sm text-destructive" role="alert">{errors.message.message}</p>}
      </div>

      {/* Marketing consent */}
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
