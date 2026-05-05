import { getProfileSettingsAction } from '@/features/profile/actions';
import SettingsForm from '@/features/profile/components/SettingsForm';
import { auth } from '@/shared/lib/auth';

export default async function SettingsPage() {
  const [session, user] = await Promise.all([auth(), getProfileSettingsAction()]);

  return (
    <SettingsForm
      firstName={user?.firstName ?? null}
      lastName={user?.lastName ?? null}
      image={user?.image ?? null}
      location={user?.location ?? null}
      email={session?.user?.email ?? null}
      hasPassword={user?.hasPassword ?? false}
    />
  );
}
