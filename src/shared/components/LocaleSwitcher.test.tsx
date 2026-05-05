import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import LocaleSwitcher from './LocaleSwitcher';

const mockReplace = vi.fn();
const mockPathname = '/catalog';

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'pl',
  useTranslations: () => (key: string) => key,
}));

const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
}));

vi.mock('@/shared/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
    className,
    role,
    'aria-checked': ariaChecked,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    className?: string;
    role?: string;
    'aria-checked'?: boolean;
  }) => (
    <div
      role={role ?? 'menuitemradio'}
      aria-checked={ariaChecked}
      className={className}
      onClick={onSelect}
    >
      {children}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams.mockReturnValue(new URLSearchParams());
});

describe('LocaleSwitcher', () => {
  it('renders globe trigger button', () => {
    render(<LocaleSwitcher />);
    expect(screen.getByRole('button', { name: 'changeLanguage' })).toBeInTheDocument();
  });

  it('shows Polski and English in dropdown', () => {
    render(<LocaleSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'changeLanguage' }));
    expect(screen.getByText('Polski')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('marks Polski as active when locale is pl', () => {
    render(<LocaleSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'changeLanguage' }));
    const polskiItem = screen.getByText('Polski').closest('[role="menuitemradio"]');
    expect(polskiItem).toHaveAttribute('aria-checked', 'true');
  });

  it('calls router.replace with en locale when English is clicked', () => {
    render(<LocaleSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'changeLanguage' }));
    fireEvent.click(screen.getByText('English'));
    expect(mockReplace).toHaveBeenCalledWith(mockPathname, { locale: 'en' });
  });

  it('preserves existing query params when switching locale', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('search=spin&difficulty=advanced'));
    render(<LocaleSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'changeLanguage' }));
    fireEvent.click(screen.getByText('English'));
    expect(mockReplace).toHaveBeenCalledWith(`${mockPathname}?search=spin&difficulty=advanced`, {
      locale: 'en',
    });
  });
});
