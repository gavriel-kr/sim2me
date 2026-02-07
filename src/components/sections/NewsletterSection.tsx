'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newsletterSchema, type NewsletterFormData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Mail, ArrowRight } from 'lucide-react';

export function NewsletterSection() {
  const t = useTranslations('home');
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  function onSubmit(data: NewsletterFormData) {
    toast({
      title: 'Subscribed!',
      description: `We'll send updates to ${data.email}`,
      variant: 'success',
    });
    reset();
  }

  return (
    <section className="border-t border-border/40 bg-muted/20 py-16 sm:py-20">
      <div className="container mx-auto max-w-xl px-4 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Mail className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t('newsletterTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Get exclusive deals and travel tips delivered to your inbox</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-2">
          <div className="flex-1">
            <Label htmlFor="newsletter-email" className="sr-only">
              {t('newsletterPlaceholder')}
            </Label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder={t('newsletterPlaceholder')}
              className="h-12 rounded-xl text-base"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-left text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="h-12 rounded-xl px-6 text-base font-semibold shadow-sm sm:shrink-0">
            <span className="flex items-center gap-2">
              {t('newsletterButton')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">No spam, unsubscribe anytime.</p>
      </div>
    </section>
  );
}
