'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { StickyHelpButton } from './StickyHelpButton';
import { InstallAppBanner } from './InstallAppBanner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] flex flex-col">{children}</main>
      <Footer />
      <StickyHelpButton />
      <InstallAppBanner />
    </>
  );
}
