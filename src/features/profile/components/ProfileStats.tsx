import { Award, CheckCircle2, Heart, Rotate3D } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

type ProfileStatsProps = {
  masteredCount: number;
  inProgressCount: number;
  favouritesCount: number;
};

type StatCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="group flex flex-col justify-between bg-surface-low p-6 transition-colors hover:bg-surface-container md:p-8">
      <div className="mb-6 text-primary/50 transition-colors group-hover:text-primary">
        <span className="inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-125">
          {icon}
        </span>
      </div>
      <div>
        <p className="mb-2 font-display text-4xl font-bold text-on-surface md:text-5xl">{value}</p>
        <p className="text-xs tracking-widest text-on-surface-variant uppercase">{label}</p>
      </div>
    </div>
  );
}

export default async function ProfileStats({
  masteredCount,
  inProgressCount,
  favouritesCount,
}: ProfileStatsProps) {
  const t = await getTranslations('profile');
  const te = await getTranslations('enums');

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-6">
      <StatCard
        icon={<CheckCircle2 size={32} aria-hidden="true" />}
        value={masteredCount}
        label={t('movesMastered')}
      />
      <StatCard
        icon={<Rotate3D size={32} aria-hidden="true" />}
        value={inProgressCount}
        label={te('learnStatus.IN_PROGRESS')}
      />
      <StatCard
        icon={<Heart size={32} aria-hidden="true" />}
        value={favouritesCount}
        label={t('favourites')}
      />
      <StatCard icon={<Award size={32} aria-hidden="true" />} value="—" label={t('trainingSessions')} />
    </div>
  );
}
