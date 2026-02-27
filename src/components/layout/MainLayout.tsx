'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { StickyHelpButton } from './StickyHelpButton';
import { InstallAppBanner } from './InstallAppBanner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-[100] rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="min-h-[calc(100vh-4rem)] flex flex-col" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <StickyHelpButton />
      <InstallAppBanner />
    </>
  );
}
