'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { useRouter } = createSharedPathnamesNavigation(routing);

interface SearchDestinationProps {
  ctaLabel?: string;
}

export function SearchDestination({ ctaLabel }: SearchDestinationProps = {}) {
  const t = useTranslations('nav');
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleNavigate = useCallback(() => {
    const q = query.trim();
    if (q) {
      router.push(`/destinations?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/destinations');
    }
  }, [query, router]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
          className="h-12 pl-10 pr-4 text-base rounded-xl"
          aria-label={t('searchPlaceholder')}
        />
      </div>

      {ctaLabel && (
        <button
          type="button"
          onClick={handleNavigate}
          className="mt-3 w-full inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-glow hover:brightness-105"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
