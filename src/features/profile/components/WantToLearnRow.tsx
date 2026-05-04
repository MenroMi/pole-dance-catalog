'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { LearnStatus } from '@/shared/types';

import type { ProgressWithMove } from '../types';

import ProgressStatusPicker from './ProgressStatusPicker';

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: '#84d099',
  INTERMEDIATE: '#dcb8ff',
  ADVANCED: '#f59e0b',
};

type WantToLearnRowProps = {
  item: ProgressWithMove;
  onStatusChange: (moveId: string, status: LearnStatus | null) => void;
  isPending: boolean;
};

export default function WantToLearnRow({ item, onStatusChange, isPending }: WantToLearnRowProps) {
  const te = useTranslations('enums');
  const color = DIFFICULTY_COLOR[item.move.difficulty] ?? DIFFICULTY_COLOR.BEGINNER;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-outline-variant/15 bg-surface-container p-3.5">
      <Link
        href={`/moves/${item.moveId}`}
        className="bg-surface-container-highest relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg"
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.move.imageUrl ? (
          <Image
            src={item.move.imageUrl}
            alt={item.move.title}
            fill
            className="object-cover opacity-80"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-primary/30">
            {item.move.title.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <Link href={`/moves/${item.moveId}`} className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-medium text-on-surface transition-colors hover:text-primary">
          {item.move.title}
        </p>
        <span
          className="mt-0.5 inline-block rounded-full px-2 py-0.5 font-sans text-[9px] font-bold tracking-[0.14em] uppercase"
          style={{ background: `${color}18`, color }}
        >
          {te(`difficulty.${item.move.difficulty}`)}
        </span>
      </Link>

      <div className="w-[300px] shrink-0">
        <ProgressStatusPicker
          currentStatus={item.status}
          onStatusChange={(status) => onStatusChange(item.moveId, status)}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
