import { redirect } from 'next/navigation';

import { auth } from '@/shared/lib/auth';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') redirect('/');
  return <div>Admin Dashboard</div>;
}
