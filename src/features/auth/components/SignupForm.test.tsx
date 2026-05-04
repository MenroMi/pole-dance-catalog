import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SignupForm } from './SignupForm';

vi.mock('@/features/auth/actions', () => ({
  signupAction: vi.fn(),
}));
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
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

import { signupAction } from '@/features/auth/actions';
const mockSignupAction = signupAction as ReturnType<typeof vi.fn>;

const originalGeolocation = global.navigator.geolocation;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: originalGeolocation,
    configurable: true,
  });
});

describe('SignupForm', () => {
  it('renders firstName, lastName, email, password fields and submit button', () => {
    render(<SignupForm />);
    expect(screen.getByLabelText('firstNameLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('lastNameLabel')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submit' })).toBeInTheDocument();
  });

  it('shows validation error for missing firstName on submit', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(screen.getByLabelText('lastNameLabel'), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
  });

  it('shows validation error for short password on submit', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(screen.getByLabelText('firstNameLabel'), 'Alice');
    await user.type(screen.getByLabelText('lastNameLabel'), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Ab1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(await screen.findByText(/at least 8/i)).toBeInTheDocument();
  });

  it('calls signupAction with form data on valid submit', async () => {
    mockSignupAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('firstNameLabel'), 'Alice');
    await user.type(screen.getByLabelText('lastNameLabel'), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(mockSignupAction).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'Password1!',
    });
  });

  it('appends detected location to signupAction when geolocation succeeds', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({ coords: { latitude: 52.23, longitude: 21.01 } } as GeolocationPosition),
      },
      configurable: true,
    });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ location: 'Warsaw, Poland' }) });
    mockSignupAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(screen.getByLabelText('firstNameLabel'), 'Alice');
    await user.type(screen.getByLabelText('lastNameLabel'), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password1!');
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() =>
      expect(mockSignupAction).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'Warsaw, Poland' }),
      ),
    );
  });

  it('omits location from signupAction when geolocation is unavailable', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
    mockSignupAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(screen.getByLabelText('firstNameLabel'), 'Alice');
    await user.type(screen.getByLabelText('lastNameLabel'), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() =>
      expect(mockSignupAction).toHaveBeenCalledWith(
        expect.not.objectContaining({ location: expect.anything() }),
      ),
    );
  });

  it('displays server error returned from signupAction', async () => {
    mockSignupAction.mockResolvedValue({ error: 'Email already in use' });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('firstNameLabel'), 'Alice');
    await user.type(screen.getByLabelText('lastNameLabel'), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText('emailAlreadyInUse')).toBeInTheDocument();
  });
});
