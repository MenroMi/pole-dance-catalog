import { NextRequest, NextResponse } from 'next/server';

import { deleteVerificationToken } from '@/features/auth/lib/tokens';
import { defaultLocale } from '@/i18n/routing';
import { prisma } from '@/shared/lib/prisma';
import { verifyRatelimit } from '@/shared/lib/ratelimit';

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? process.env.RATELIMIT_FALLBACK_IP!;
  const { success } = await verifyRatelimit.limit(ip);
  if (!success) {
    return NextResponse.redirect(new URL(`/${defaultLocale}/verify-email?error=invalid`, req.url));
  }

  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL(`/${defaultLocale}/verify-email?error=invalid`, req.url));
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL(`/${defaultLocale}/verify-email?error=invalid`, req.url),
      );
    }

    const tokenLocale = verificationToken.locale ?? defaultLocale;

    if (verificationToken.expires < new Date()) {
      await deleteVerificationToken(token);
      return NextResponse.redirect(new URL(`/${tokenLocale}/verify-email?error=expired`, req.url));
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.redirect(new URL(`/${tokenLocale}/login?verified=true`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/${defaultLocale}/verify-email?error=server`, req.url));
  }
}
