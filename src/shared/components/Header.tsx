import { Link } from '@/i18n/navigation';
import { auth } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

import FavouritesButton from './FavouritesButton';
import HeaderNav from './HeaderNav';
import LocaleSwitcher from './LocaleSwitcher';
import UserMenu from './UserMenu';

export default async function Header() {
  const session = await auth();
  let user: { name: string | null; image: string | null } | null = null;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, image: true },
    });
    if (dbUser) {
      const name = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || null;
      user = { name, image: dbUser.image ?? null };
    }
  }

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

        <div className="flex items-center gap-1 justify-self-end">
          <FavouritesButton />
          <UserMenu user={user} />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
