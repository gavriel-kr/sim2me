import { MainLayout } from '@/components/layout/MainLayout';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export const metadata = {
  title: 'eSIM installation guide',
  description: 'How to install your SIM2ME eSIM on iPhone or Android.',
};

export default function InstallationGuidePage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-primary">eSIM installation guide</h1>
        <p className="mt-2 text-muted-foreground">
          Follow these steps to install your eSIM. You can print this page (Ctrl+P / Cmd+P) and save as PDF.
        </p>

        <div className="mt-8 space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
          <section>
            <h2 className="text-lg font-semibold">iPhone (iOS)</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>Go to <strong>Settings</strong> → <strong>Cellular</strong> (or Mobile Data).</li>
              <li>Tap <strong>Add Cellular Plan</strong>.</li>
              <li>Scan the QR code you received by email, or enter the SM-DP+ address and Activation Code manually.</li>
              <li>Label the plan (e.g. &quot;Travel&quot;) and tap Continue.</li>
              <li>Turn on the line when you arrive at your destination. Enable <strong>Data Roaming</strong> for this plan.</li>
            </ol>
          </section>
          <section>
            <h2 className="text-lg font-semibold">Android</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>Go to <strong>Settings</strong> → <strong>Network &amp; internet</strong> → <strong>SIMs</strong> (or Mobile network).</li>
              <li>Tap <strong>Add eSIM</strong> or <strong>Download a SIM instead</strong>.</li>
              <li>Scan the QR code you received, or choose &quot;Enter details manually&quot; and add SM-DP+ address and Activation Code.</li>
              <li>Name the eSIM and confirm. Activate it when you land and turn on <strong>Data roaming</strong> for this SIM.</li>
            </ol>
          </section>
          <section>
            <h2 className="text-lg font-semibold">Tips</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>Install the eSIM while you have Wi‑Fi (e.g. before you travel).</li>
              <li>Only turn on Data Roaming when you are in the destination country.</li>
              <li>Keep the QR code and activation details in a safe place; you may need them again.</li>
            </ul>
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <IntlLink href="/" className="text-primary hover:underline">Back to home</IntlLink>
        </p>
      </div>
    </MainLayout>
  );
}
