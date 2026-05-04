import { Settings, User } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

type ProfileHeroProps = {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  image: string | null;
  location: string | null;
  createdAt: Date;
};

export default async function ProfileHero({
  firstName,
  lastName,
  username,
  image,
  location,
  createdAt,
}: ProfileHeroProps) {
  const t = await getTranslations('profile');
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'anonymous';
  const joinYear = createdAt.getFullYear();

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-outline-variant/40 p-10 md:p-12"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #16101e 50%, #2b1545 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 right-[-10%] h-[500px] w-[500px] rounded-full blur-[80px]"
        style={{
          background: 'radial-gradient(circle, rgba(220,184,255,0.18), transparent 60%)',
        }}
      />

      <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-end">
        {/* Avatar — keep as-is */}
        <div className="group relative shrink-0">
          <div className="relative z-10 h-32 w-32 overflow-hidden rounded-2xl bg-surface-container ring-1 ring-outline-variant/20 md:h-40 md:w-40">
            {image ? (
              <Image src={image} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                <User size={56} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 -z-10 scale-110 rounded-2xl bg-primary/20 opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80" />
        </div>

        {/* Name + meta */}
        <div className="flex-1 space-y-2">
          {location && (
            <p className="font-sans text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
              {location}
            </p>
          )}
          <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface lowercase md:text-[56px] md:leading-none">
            {displayName}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            {username ? `@${username} · ` : ''}
            {t('joinedYear', { year: joinYear })}
          </p>
        </div>

        {/* Settings link */}
        <Link
          href="/profile/settings"
          aria-label={t('heroSettingsLabel')}
          className="flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-transparent px-4 py-2.5 font-sans text-[13px] font-semibold text-on-surface-variant transition-colors hover:border-outline-variant hover:text-on-surface"
        >
          <Settings size={14} aria-hidden="true" />
          {t('settings')}
        </Link>
      </div>
    </section>
  );
}
