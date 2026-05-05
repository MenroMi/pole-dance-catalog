import ForgotPasswordForm from './ForgotPasswordForm';

type Props = {
  searchParams: Promise<{ sent?: string; expired?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent, expired } = await searchParams;
  return <ForgotPasswordForm sent={!!sent} expired={!!expired} />;
}
