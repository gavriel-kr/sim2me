'use client';

/**
 * An eSIM's QR code, drawn in the browser from its activation details.
 *
 * Why (2026-09-28): PikaSim's QR images are hosted on airalo.com, which the site's security policy
 * (CSP `img-src`) does not allow, so the account page and the success page showed a broken image for
 * phone plans while the email, which no CSP applies to, showed it fine. A QR code only encodes
 * `LPA:1$<SM-DP+ address>$<activation code>` — the same string the install buttons already use — so
 * drawing it here works for every supplier. The supplier's image is only the fallback, for an order
 * without activation details.
 */

import { useEffect, useState } from 'react';

/** The string an eSIM QR code encodes, or null without both halves. */
export function lpaString(smdpAddress: string | null | undefined, activationCode: string | null | undefined): string | null {
  if (!smdpAddress || !activationCode) return null;
  if (activationCode.startsWith('LPA:')) return activationCode;
  return `LPA:1$${smdpAddress}$${activationCode}`;
}

interface Props {
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  alt: string;
  className?: string;
  /** Shows a download link under the image when set. */
  download?: { label: string; className?: string; icon?: React.ReactNode };
}

export function EsimQrCode({ qrCodeUrl, smdpAddress, activationCode, alt, className, download }: Props) {
  const lpa = lpaString(smdpAddress, activationCode);
  const [drawn, setDrawn] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!lpa) return;
    let cancelled = false;
    setDrawn(null);
    setFailed(false);
    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(lpa, { width: 320, margin: 1, errorCorrectionLevel: 'M' }))
      .then((url) => {
        if (!cancelled) setDrawn(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lpa]);

  // With activation details, wait for our own drawing (a few ms) rather than flash a blocked image.
  const src = lpa && !failed ? drawn : qrCodeUrl;
  if (!src) return <div className={className} aria-busy={Boolean(lpa && !failed)} />;

  return (
    <>
      <img src={src} alt={alt} className={className} />
      {download && (
        <a href={src} download="esim-qr.png" className={download.className}>
          {download.icon}
          {download.label}
        </a>
      )}
    </>
  );
}
