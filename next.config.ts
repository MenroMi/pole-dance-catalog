import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://img.youtube.com https://lh3.googleusercontent.com https://*.fbsbx.com https://graph.facebook.com",
      'frame-src https://www.youtube.com',
      "connect-src 'self' ws: wss:",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    const noStore = [{ key: 'Cache-Control', value: 'no-store' }];
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/[a-z]{2}/profile/(.*)', headers: noStore },
      { source: '/[a-z]{2}/settings(.*)', headers: noStore },
      { source: '/[a-z]{2}/reset-password(.*)', headers: noStore },
      { source: '/[a-z]{2}/admin(.*)', headers: noStore },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.fbsbx.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
