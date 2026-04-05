import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com', pathname: '/**' },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/favicon.png' }];
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox-buy.paddle.com https://buy.paddle.com https://cdn.paddle.com https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.paddle.com",
          "img-src 'self' data: blob: https://flagcdn.com https://sandbox-buy.paddle.com https://buy.paddle.com https://cdn.paddle.com https://www.googletagmanager.com https://www.google-analytics.com",
          "connect-src 'self' https://sandbox-buy.paddle.com https://buy.paddle.com https://cdn.paddle.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
          "frame-src https://sandbox-buy.paddle.com https://buy.paddle.com https://cdn.paddle.com",
          "font-src 'self' data: https://fonts.gstatic.com https://cdn.paddle.com",
          "object-src 'none'",
          "base-uri 'self'",
          "worker-src 'self' blob:",
        ].join('; '),
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/app/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/app/icon.png',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
