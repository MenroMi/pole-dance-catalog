'use client';
import { Heart } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useOptimistic, useTransition } from 'react';

import { addFavouriteAction, removeFavouriteAction } from '@/features/profile/actions';

type MoveFavouriteButtonProps = {
  moveId: string;
  isFavourited: boolean;
  isAuthenticated: boolean;
};

export default function MoveFavouriteButton({
  moveId,
  isFavourited,
  isAuthenticated,
}: MoveFavouriteButtonProps) {
  const router = useRouter();
  const [optimisticFav, setOptimisticFav] = useOptimistic(isFavourited);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    startTransition(async () => {
      setOptimisticFav((prev) => !prev);
      if (isFavourited) {
        await removeFavouriteAction(moveId);
      } else {
        await addFavouriteAction(moveId);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={optimisticFav ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={optimisticFav}
      className={`inline-flex h-full shrink-0 cursor-pointer items-center gap-1 overflow-hidden rounded-lg border border-outline-variant/15 bg-[#1f1f1f] pl-[10px] transition-[width] duration-300 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        optimisticFav ? 'w-10 text-primary' : 'w-[88px] text-on-surface-variant'
      }`}
    >
      <Heart
        size={18}
        fill={optimisticFav ? 'currentColor' : 'none'}
        className="shrink-0"
        aria-hidden="true"
      />
      <span
        className={`overflow-hidden font-sans text-[11px] leading-[0.9] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-all duration-200 ${
          optimisticFav ? 'max-w-0 opacity-0' : 'ml-2 max-w-[60px] opacity-100'
        }`}
      >
        Save
      </span>
    </button>
  );
}
