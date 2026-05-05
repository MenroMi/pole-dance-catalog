import crypto from 'crypto';

import type { Locale } from '@/i18n/routing';
import { prisma } from '@/shared/lib/prisma';

export async function generateResetToken(email: string, locale: Locale): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { email, token, expiresAt, locale } });
  return token;
}

export async function findResetToken(token: string) {
  return prisma.passwordResetToken.findUnique({ where: { token } });
}

export async function deleteResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.delete({ where: { token } });
}

export async function deleteResetTokensByEmail(email: string): Promise<void> {
  await prisma.passwordResetToken.deleteMany({ where: { email } });
}
