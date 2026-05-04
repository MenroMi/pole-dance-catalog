'use client';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Tab = 'breakdown' | 'muscles' | 'safety';

export default function MoveTabs({ breakdown }: { breakdown: ReactNode }) {
  const t = useTranslations('moves');
  const [active, setActive] = useState<Tab>('breakdown');
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'breakdown', label: t('breakdown') },
    { id: 'muscles', label: t('muscles') },
    { id: 'safety', label: t('safety') },
  ];

  useLayoutEffect(() => {
    const activeIndex = TABS.findIndex((tab) => tab.id === active);
    const el = tabRefs.current[activeIndex];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <div>
      <div
        role="tablist"
        className="relative mb-8 flex gap-8 border-b border-outline-variant/15 pb-4"
      >
        {TABS.map(({ id, label }, i) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`tab-${id}`}
            role="tab"
            aria-selected={active === id}
            aria-controls="move-tabpanel"
            tabIndex={active === id ? 0 : -1}
            onClick={() => setActive(id)}
            onKeyDown={(e) => {
              const count = TABS.length;
              const activeIndex = TABS.findIndex((tab) => tab.id === active);
              if (e.key === 'ArrowRight') {
                const nextIndex = (activeIndex + 1) % count;
                setActive(TABS[nextIndex].id);
                tabRefs.current[nextIndex]?.focus();
              } else if (e.key === 'ArrowLeft') {
                const prevIndex = (activeIndex - 1 + count) % count;
                setActive(TABS[prevIndex].id);
                tabRefs.current[prevIndex]?.focus();
              }
            }}
            className={`font-display text-lg tracking-wide uppercase transition-colors duration-200 ${
              active === id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}

        {/* sliding indicator */}
        <span
          aria-hidden="true"
          className="absolute -bottom-[1px] h-[2px] bg-gradient-to-r from-primary to-[#8458b3] transition-all duration-300 ease-in-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      <div id="move-tabpanel" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}>
        <div key={active} className="animate-in duration-200 fade-in-0 slide-in-from-bottom-2">
          {active === 'breakdown' && breakdown}
          {(active === 'muscles' || active === 'safety') && (
            <p className="py-12 text-center font-display text-xs font-bold tracking-[0.3em] text-on-surface-variant uppercase">
              {t('comingSoon')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
