import { Link } from '@/i18n/navigation';

import { auth } from '@/shared/lib/auth';

import FavouritesButton from './FavouritesButton';
import HeaderNav from './HeaderNav';
import LocaleSwitcher from './LocaleSwitcher';
import UserMenu from './UserMenu';

export default async function Header() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return (
    <header
      className="sticky top-0 z-50 h-[60px] border-b border-outline-variant/30 backdrop-blur-xl"
      style={{ backgroundColor: 'rgba(19, 19, 19, 0.85)' }}
    >
      <div className="mx-auto grid h-full w-full max-w-[2560px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="justify-self-start">
          <Link
            href={session ? '/catalog' : '/'}
            className="font-display text-[17px] font-semibold tracking-tight text-on-surface lowercase"
          >
            pole space<span className="text-primary">.</span>
          </Link>
        </div>

        <HeaderNav />

        <div className="flex items-center gap-2 justify-self-end">
          <FavouritesButton hasNew={Boolean(user)} />
          <LocaleSwitcher />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
