import { AdminApp } from '@/features/admin/components/AdminApp';
import { auth } from '@/shared/lib/auth';

export default async function AdminPage() {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const currentUserName = session?.user?.name ?? null;
  return <AdminApp currentUserId={currentUserId} currentUserName={currentUserName} />;
}
