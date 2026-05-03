import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));
vi.mock('@/features/auth/actions', () => ({
  checkEmailVerifiedAction: vi.fn(),
}));
vi.mock('@/features/auth', () => ({
  RESEND_COOLDOWN_S: 60,
}));

import { checkEmailVerifiedAction } from '@/features/auth/actions';

import { ResendForm } from './ResendForm';

const mockReplace = vi.fn();
const mockCheckVerified = checkEmailVerifiedAction as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as unknown as ReturnType<
    typeof useRouter
  >);
});

describe('ResendForm — visibilitychange', () => {
  it('calls router.replace(/catalog) when tab gains focus and email is verified', async () => {
    mockCheckVerified.mockResolvedValue(true);

    render(<ResendForm action={vi.fn()} email="alice@example.com" />);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(mockCheckVerified).toHaveBeenCalledWith('alice@example.com');
      expect(mockReplace).toHaveBeenCalledWith('/catalog');
    });
  });

  it('does not redirect when tab gains focus but email is not yet verified', async () => {
    mockCheckVerified.mockResolvedValue(false);

    render(<ResendForm action={vi.fn()} email="alice@example.com" />);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(mockCheckVerified).toHaveBeenCalledWith('alice@example.com');
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('ResendForm — handleAction', () => {
  it('does not start countdown and redirects to /catalog when email is already verified', async () => {
    mockCheckVerified.mockResolvedValue(true);
    const mockAction = vi.fn().mockResolvedValue(undefined);

    const { container, getByRole } = render(
      <ResendForm action={mockAction} email="alice@example.com" />,
    );

    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/catalog');
    });
    expect(mockAction).not.toHaveBeenCalled();
    expect(getByRole('button')).toHaveTextContent('resend verification email');
  });

  it('calls action() and starts countdown when email is not yet verified', async () => {
    mockCheckVerified.mockResolvedValue(false);
    const mockAction = vi.fn().mockResolvedValue(undefined);

    const { getByRole, container } = render(
      <ResendForm action={mockAction} email="alice@example.com" />,
    );

    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalled();
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(getByRole('button')).toHaveTextContent(/resend in \d+s/);
  });
});

describe('ResendForm — polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('redirects to /catalog when 5s polling detects verified email', async () => {
    mockCheckVerified.mockResolvedValue(true);

    render(<ResendForm action={vi.fn()} email="alice@example.com" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockCheckVerified).toHaveBeenCalledWith('alice@example.com');
    expect(mockReplace).toHaveBeenCalledWith('/catalog');
  });

  it('does not redirect when polling returns not yet verified', async () => {
    mockCheckVerified.mockResolvedValue(false);

    render(<ResendForm action={vi.fn()} email="alice@example.com" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockCheckVerified).toHaveBeenCalledWith('alice@example.com');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects only once when polling and visibilitychange both detect verification', async () => {
    mockCheckVerified.mockResolvedValue(true);

    render(<ResendForm action={vi.fn()} email="alice@example.com" />);

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('does not call check when visibilitychange fires while tab is hidden', async () => {
    mockCheckVerified.mockResolvedValue(false);

    render(<ResendForm action={vi.fn()} email="alice@example.com" />);

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockCheckVerified).not.toHaveBeenCalled();
  });

  it('clears poll interval and removes visibilitychange listener on unmount', () => {
    mockCheckVerified.mockResolvedValue(false);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<ResendForm action={vi.fn()} email="alice@example.com" />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    clearIntervalSpy.mockRestore();
    removeListenerSpy.mockRestore();
  });
});
