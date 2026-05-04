import { Link } from '@/i18n/navigation';

export default function FavouritesWidget() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-on-surface">Favourites</h2>
        <Link href="/profile/favourite-moves" className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </div>
      <p className="text-sm text-on-surface-variant">Add favourites from individual move pages.</p>
    </div>
  );
}
