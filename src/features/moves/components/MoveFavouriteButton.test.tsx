import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoveFavouriteButton from './MoveFavouriteButton';

vi.mock('@/features/profile/actions', () => ({
  addFavouriteAction: vi.fn().mockResolvedValue({ success: true }),
  removeFavouriteAction: vi.fn().mockResolvedValue({ success: true }),
}));

const mockPush = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: React.ReactNode;
  }) => React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: mockPush }),
  redirect: vi.fn(),
}));

import { addFavouriteAction, removeFavouriteAction } from '@/features/profile/actions';

const mockAdd = vi.mocked(addFavouriteAction);
const mockRemove = vi.mocked(removeFavouriteAction);

beforeEach(() => vi.clearAllMocks());

describe('MoveFavouriteButton', () => {
  it('has aria-label "removeFromFavourites" when already favourited', () => {
    render(<MoveFavouriteButton moveId="m1" isFavourited={true} isAuthenticated={true} />);
    expect(screen.getByRole('button', { name: 'removeFromFavourites' })).toBeInTheDocument();
  });

  it('has aria-label "addToFavourites" when not favourited', () => {
    render(<MoveFavouriteButton moveId="m1" isFavourited={false} isAuthenticated={true} />);
    expect(screen.getByRole('button', { name: 'addToFavourites' })).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', async () => {
    const user = userEvent.setup();
    render(<MoveFavouriteButton moveId="m1" isFavourited={false} isAuthenticated={false} />);
    await user.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('calls addFavouriteAction when not favourited and authenticated', async () => {
    const user = userEvent.setup();
    render(<MoveFavouriteButton moveId="m1" isFavourited={false} isAuthenticated={true} />);
    await user.click(screen.getByRole('button'));
    expect(mockAdd).toHaveBeenCalledWith('m1');
  });

  it('calls removeFavouriteAction when already favourited and authenticated', async () => {
    const user = userEvent.setup();
    render(<MoveFavouriteButton moveId="m1" isFavourited={true} isAuthenticated={true} />);
    await user.click(screen.getByRole('button'));
    expect(mockRemove).toHaveBeenCalledWith('m1');
  });
});
