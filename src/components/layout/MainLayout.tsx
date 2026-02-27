'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { StickyHelpButton } from './StickyHelpButton';
import { InstallAppBanner } from './InstallAppBanner';
import { AccessibilityToolbar } from './AccessibilityToolbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Skip link: visible only on keyboard Tab focus, never on mouse (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="min-h-[calc(100vh-4rem)] flex flex-col" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <StickyHelpButton />
      <AccessibilityToolbar />
      <InstallAppBanner />
    </>
  );
}
