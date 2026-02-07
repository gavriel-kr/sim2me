'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newsletterSchema, type NewsletterFormData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';

export function NewsletterSection() {
  const t = useTranslations('home');
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  function onSubmit(data: NewsletterFormData) {
    // Mock: in production send to API
    toast({
      title: 'Subscribed!',
      description: `We'll send updates to ${data.email}`,
      variant: 'success',
    });
    reset();
  }

  return (
    <section className="border-t border-border/40 py-16">
      <div className="container mx-auto max-w-md px-4 text-center">
        <h2 className="text-xl font-semibold">{t('newsletterTitle')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-2">
          <div className="flex-1">
            <Label htmlFor="newsletter-email" className="sr-only">
              {t('newsletterPlaceholder')}
            </Label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder={t('newsletterPlaceholder')}
              className="rounded-lg"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-left text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="rounded-lg sm:shrink-0">
            {t('newsletterButton')}
          </Button>
        </form>
      </div>
    </section>
  );
}
