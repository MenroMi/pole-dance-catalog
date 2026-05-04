import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

import { getUserProgressAction } from '../actions';

export default async function ProgressWidget() {
  const t = await getTranslations('profile');
  const te = await getTranslations('enums');
  const inProgress = (await getUserProgressAction('IN_PROGRESS')).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-on-surface">{te('learnStatus.IN_PROGRESS')}</h2>
        <Link href="/profile/progress" className="text-sm text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </div>
      {inProgress.length === 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-on-surface-variant">{t('emptyInProgress')}</p>
          <Link href="/catalog" className="text-sm text-primary hover:underline">
            {t('browseCatalog')}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {inProgress.map((p) => (
            <li key={p.id} className="text-sm text-on-surface">
              {p.move.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
