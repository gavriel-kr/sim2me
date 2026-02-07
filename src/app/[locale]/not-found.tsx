'use client';

import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { MainLayout } from '@/components/layout/MainLayout';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">This page could not be found.</p>
        <IntlLink
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </IntlLink>
      </div>
    </MainLayout>
  );
}
