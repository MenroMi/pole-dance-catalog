import { redirect } from 'next/navigation';

import { findResetToken } from '@/features/auth/lib/reset-tokens';

import ResetPasswordForm from './ResetPasswordForm';

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) redirect('/forgot-password?expired=true');

  const record = await findResetToken(token);
  if (!record || record.expiresAt < new Date()) {
    redirect('/forgot-password?expired=true');
  }

  return <ResetPasswordForm token={token} />;
}
