'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export function StickyHelpButton() {
  const pathname = usePathname();
  // Extract locale from pathname (e.g. /he/... → he)
  const locale = pathname?.split('/')[1] || 'he';
  const contactHref = `/${locale}/contact`;

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col gap-2" dir="ltr">
      <Link
        href={contactHref}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
        aria-label="צור קשר"
      >
        <MessageCircle className="h-7 w-7" />
      </Link>
    </div>
  );
}
