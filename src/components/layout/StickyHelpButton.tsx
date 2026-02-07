'use client';

import { brandConfig } from '@/config/brand';
import { MessageCircle, Mail } from 'lucide-react';

export function StickyHelpButton() {
  const { helpButton, whatsappNumber, whatsappMessage, supportEmail } = brandConfig;
  const showWhatsApp = helpButton === 'whatsapp' || helpButton === 'both';
  const showEmail = helpButton === 'email' || helpButton === 'both';

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col gap-2" dir="ltr">
      {showWhatsApp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
      {showEmail && (
        <a
          href={`mailto:${supportEmail}`}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Email support"
        >
          <Mail className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
