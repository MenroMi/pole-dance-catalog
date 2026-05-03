'use server';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { AuthError } from 'next-auth';
import { z } from 'zod';

import { signIn } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';
import { signupRatelimit, resendRatelimit, forgotPasswordRatelimit } from '@/shared/lib/ratelimit';

import { RESEND_COOLDOWN_MS } from './lib/cooldown-config';
import { sendVerificationEmail } from './lib/email';
import { sendPasswordResetEmail } from './lib/reset-email';
import {
  generateResetToken,
  deleteResetTokensByEmail,
  findResetToken,
  deleteResetToken,
} from './lib/reset-tokens';
import { generateVerificationToken, deleteUserTokens } from './lib/tokens';
import { applyPasswordComplexity, signupSchema } from './lib/validation';
import type { SignupFormData, LoginFormData } from './lib/validation';

export async function signupAction(data: SignupFormData) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
  const { success: withinLimit } = await signupRatelimit.limit(ip);
  if (!withinLimit) return { error: 'Too many requests' };

  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) return { error: 'Invalid input' };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: 'Email already in use' };

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      password: hashed,
      location: parsed.data.location ?? null,
      emailVerified: null,
    },
  });

  const token = await generateVerificationToken(parsed.data.email);

  try {
    await sendVerificationEmail(parsed.data.email, token);
  } catch {
    await deleteUserTokens(parsed.data.email);
    await prisma.user.delete({ where: { email: parsed.data.email } });
    return { error: 'Failed to send email, please try again' };
  }

  const locale = await getLocale();
  redirect(`/${locale}/verify-email?sent=true&email=${encodeURIComponent(parsed.data.email)}`);
}

export async function loginAction(data: LoginFormData) {
  try {
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirectTo: '/catalog',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const cause = error.cause as { err?: Error } | undefined;
      const message = cause?.err?.message ?? 'Invalid credentials';
      if (message === 'Please verify your email first') {
        return { error: message, email: data.email };
      }
      return { error: message };
    }
    throw error;
  }
}

export async function resendVerificationAction(email: string) {
  const { success: withinLimit } = await resendRatelimit.limit(email);
  const locale = await getLocale();
  if (!withinLimit) redirect(`/${locale}/verify-email?error=rate-limited`);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) redirect(`/${locale}/verify-email?error=invalid`);
  if (user.emailVerified !== null) redirect(`/${locale}/catalog`);

  const existing = await prisma.verificationToken.findFirst({ where: { identifier: email } });
  if (existing) {
    if (Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      redirect(`/${locale}/verify-email?sent=true&email=${encodeURIComponent(email)}`);
    }
  }

  await deleteUserTokens(email);
  const token = await generateVerificationToken(email);

  try {
    await sendVerificationEmail(email, token);
  } catch {
    await deleteUserTokens(email);
    redirect(`/${locale}/verify-email?error=send-failed&email=${encodeURIComponent(email)}`);
  }

  redirect(`/${locale}/verify-email?sent=true&email=${encodeURIComponent(email)}`);
}

export async function checkEmailVerifiedAction(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });
  return user !== null && user.emailVerified !== null;
}

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .superRefine(applyPasswordComplexity);

export async function forgotPasswordAction(
  email: string,
): Promise<{ sent: true } | { error: string }> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
  const { success: withinLimit } = await forgotPasswordRatelimit.limit(ip);
  if (!withinLimit) return { sent: true };

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return { error: 'Invalid email' };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (!user || user.password === null) return { sent: true };

  await deleteResetTokensByEmail(email);
  const token = await generateResetToken(email);

  try {
    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error('[forgotPasswordAction] email send failed:', err);
    await deleteResetToken(token);
    // intentional: return { sent: true } to prevent user enumeration
  }

  return { sent: true };
}

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<{ success: true } | { error: string }> {
  const passwordResult = resetPasswordSchema.safeParse(newPassword);
  if (!passwordResult.success) return { error: 'Invalid password' };

  const record = await findResetToken(token);
  if (!record) return { error: 'invalid' };
  if (record.expiresAt < new Date()) return { error: 'expired' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email: record.email }, data: { password: hashed } });
  await deleteResetToken(token);

  return { success: true };
}
