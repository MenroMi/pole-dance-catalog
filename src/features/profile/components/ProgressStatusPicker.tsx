'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { LearnStatus } from '@/shared/types';

const STATUS_VALUES: LearnStatus[] = ['WANT_TO_LEARN', 'IN_PROGRESS', 'LEARNED'];

type ProgressStatusPickerProps = {
  currentStatus: LearnStatus | null;
  onStatusChange: (status: LearnStatus | null) => void;
  isPending: boolean;
};

export default function ProgressStatusPicker({
  currentStatus,
  onStatusChange,
  isPending,
}: ProgressStatusPickerProps) {
  const te = useTranslations('enums');
  const activeIndex = STATUS_VALUES.indexOf(currentStatus as LearnStatus);
  const hasActive = activeIndex !== -1;

  const [prevStatus, setPrevStatus] = useState(currentStatus);
  const [pillIndex, setPillIndex] = useState(hasActive ? activeIndex : 0);

  if (currentStatus !== prevStatus) {
    setPrevStatus(currentStatus);
    if (activeIndex !== -1) setPillIndex(activeIndex);
  }

  return (
    <div className="relative flex h-full rounded-lg border border-outline-variant/30 bg-[#0e0e0e] p-1">
      <div
        aria-hidden="true"
        className={`absolute top-1 bottom-1 left-1 rounded-md bg-gradient-to-br from-[#dcb8ff] via-[#8458b3] to-[#dcb8ff] transition-[transform,opacity] duration-300 ease-out ${
          hasActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: 'calc((100% - 8px) / 3)',
          transform: `translateX(calc(${pillIndex} * 100%))`,
        }}
      />
      {STATUS_VALUES.map((value) => {
        const active = currentStatus === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(active ? null : value)}
            disabled={isPending}
            aria-pressed={active}
            className={`relative z-10 flex-1 cursor-pointer rounded-md px-3 py-2 font-sans text-xs font-semibold transition-colors duration-200 disabled:cursor-default ${
              active ? 'text-[#f8ebff]' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {te(`learnStatus.${value}`)}
          </button>
        );
      })}
    </div>
  );
}
