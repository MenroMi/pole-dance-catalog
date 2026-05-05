'use client';
import { ImageOff } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { LearnStatus } from '@/shared/types';

import type { ProgressWithMove } from '../types';

import ProgressStatusPicker from './ProgressStatusPicker';

const DIFFICULTY_BADGE: Record<string, { className: string; style?: React.CSSProperties }> = {
  BEGINNER: { className: 'bg-secondary-container text-on-secondary-container' },
  INTERMEDIATE: { className: 'bg-primary-container text-on-surface' },
  ADVANCED: { className: '', style: { backgroundColor: '#92400e', color: '#fef3c7' } },
};

type ProgressCardProps = {
  item: ProgressWithMove;
  onStatusChange: (moveId: string, status: LearnStatus | null) => void;
  isPending: boolean;
};

export default function ProgressCard({ item, onStatusChange, isPending }: ProgressCardProps) {
  const te = useTranslations('enums');
  const badge = DIFFICULTY_BADGE[item.move.difficulty] ?? DIFFICULTY_BADGE.BEGINNER;

  return (
    <div className="flex gap-4 rounded-xl bg-surface-container p-4">
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-accent">
        {item.move.imageUrl ? (
          <Image src={item.move.imageUrl} alt={item.move.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-on-surface-variant" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
            style={badge.style}
          >
            {te(`difficulty.${item.move.difficulty}`)}
          </span>
          <h3 className="font-display font-semibold text-on-surface">{item.move.title}</h3>
        </div>
        <ProgressStatusPicker
          currentStatus={item.status}
          onStatusChange={(status) => onStatusChange(item.moveId, status)}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
