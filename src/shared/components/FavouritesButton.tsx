'use client';

import { Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type FavouritesButtonProps = {
  hasNew?: boolean;
};

export default function FavouritesButton({ hasNew = false }: FavouritesButtonProps) {
  return (
    <Link
      href="/profile/favourite-moves"
      aria-label="Favourite moves"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/[0.06]"
    >
      <Heart
        className="h-[18px] w-[18px] drop-shadow-[0_0_6px_rgba(220,184,255,0.4)]"
        fill="currentColor"
        strokeWidth={0}
      />
      {hasNew && (
        <span
          aria-hidden
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary"
          style={{ boxShadow: '0 0 6px rgba(220,184,255,0.7)' }}
        />
      )}
    </Link>
  );
}
