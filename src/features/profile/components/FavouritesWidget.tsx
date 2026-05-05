import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function FavouritesWidget() {
  const t = await getTranslations('profile');

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-on-surface">{t('favourites')}</h2>
        <Link href="/profile/favourite-moves" className="text-sm text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </div>
      <p className="text-sm text-on-surface-variant">{t('addFavouritesHint')}</p>
    </div>
  );
}
