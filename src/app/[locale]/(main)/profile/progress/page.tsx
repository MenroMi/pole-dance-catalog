import { getUserProgressAction } from '@/features/profile';
import ProgressTracker from '@/features/profile/components/ProgressTracker';
import { auth } from '@/shared/lib/auth';

export default async function ProgressPage() {
  const [progress, session] = await Promise.all([getUserProgressAction(), auth()]);
  const firstName = session?.user?.name?.split(' ')[0] ?? null;
  return <ProgressTracker initialProgress={progress} userName={firstName} />;
}
