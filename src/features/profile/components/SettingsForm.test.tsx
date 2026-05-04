import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ default: vi.fn(), getServerSession: vi.fn() }));
vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/shared/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/shared/lib/cloudinary', () => ({
  cloudinary: { uploader: { upload_stream: vi.fn() } },
}));
vi.mock('../actions', () => ({
  updateProfileAction: vi.fn(),
  changePasswordAction: vi.fn(),
  uploadAvatarAction: vi.fn(),
}));
vi.mock('./AvatarUpload', () => ({ default: () => null }));

const mockPush = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: mockPush, refresh: vi.fn() }),
  redirect: vi.fn(),
}));

const mockSessionUpdate = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ update: mockSessionUpdate })),
}));

import { changePasswordSchema, profileNameSchema as profileSchema } from '../lib/validation';

import SettingsForm from './SettingsForm';
import { updateProfileAction, changePasswordAction } from '../actions';

const mockUpdateProfile = updateProfileAction as ReturnType<typeof vi.fn>;
const mockChangePassword = changePasswordAction as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionUpdate.mockResolvedValue(null);
});

describe('profileSchema', () => {
  it('rejects empty firstName', () => {
    const result = profileSchema.safeParse({ firstName: '', lastName: 'Pole' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('First name is required');
  });

  it('rejects empty lastName', () => {
    const result = profileSchema.safeParse({ firstName: 'Alice', lastName: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Last name is required');
  });

  it('accepts valid firstName and lastName', () => {
    const result = profileSchema.safeParse({ firstName: 'Alice', lastName: 'Pole' });
    expect(result.success).toBe(true);
  });

  it('rejects firstName longer than 50 characters', () => {
    const result = profileSchema.safeParse({ firstName: 'A'.repeat(51), lastName: 'Pole' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('First name is too long');
  });

  it('rejects lastName longer than 50 characters', () => {
    const result = profileSchema.safeParse({ firstName: 'Alice', lastName: 'A'.repeat(51) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Last name is too long');
  });
});

describe('changePasswordSchema', () => {
  const VALID_PW = 'Newpassword123!';

  it('rejects password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current',
      newPassword: 'Ab1!',
      confirmPassword: 'Ab1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase letter', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current',
      newPassword: 'newpassword123!',
      confirmPassword: 'newpassword123!',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      'Must contain at least one uppercase letter',
    );
  });

  it('rejects password without number', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current',
      newPassword: 'Newpassword!',
      confirmPassword: 'Newpassword!',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      'Must contain at least one number',
    );
  });

  it('rejects password without special character', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current',
      newPassword: 'Newpassword123',
      confirmPassword: 'Newpassword123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      'Must contain at least one special character',
    );
  });

  it('rejects when newPassword and confirmPassword do not match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current',
      newPassword: VALID_PW,
      confirmPassword: 'Different123!',
    });
    expect(result.success).toBe(false);
    const confirmError = result.error?.issues.find((i) => i.path.includes('confirmPassword'));
    expect(confirmError?.message).toBe('Passwords do not match');
  });

  it('accepts valid matching passwords meeting all rules', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current',
      newPassword: VALID_PW,
      confirmPassword: VALID_PW,
    });
    expect(result.success).toBe(true);
  });
});

describe('SettingsForm behavior', () => {
  const defaultProps = {
    firstName: 'Alice' as string | null,
    lastName: 'Pole' as string | null,
    image: null as string | null,
    location: null as string | null,
    email: 'alice@example.com',
    hasPassword: false,
  };

  it('discard navigates to /profile', async () => {
    const user = userEvent.setup();
    render(<SettingsForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /discard/i }));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('save calls updateProfileAction with form values and navigates on success', async () => {
    mockUpdateProfile.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<SettingsForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/profile'));
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Pole',
    });
  });

  it('skips changePasswordAction when password fields are empty', async () => {
    mockUpdateProfile.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<SettingsForm {...defaultProps} hasPassword={true} />);
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/profile'));
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('calls changePasswordAction when password fields are filled and navigates on success', async () => {
    mockUpdateProfile.mockResolvedValue({ success: true });
    mockChangePassword.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<SettingsForm {...defaultProps} hasPassword={true} />);
    await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/profile'));
    expect(mockChangePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    });
  });

  it('blocks navigation when changePasswordAction fails', async () => {
    mockUpdateProfile.mockResolvedValue({ success: true });
    mockChangePassword.mockResolvedValue({
      success: false,
      error: 'Current password is incorrect',
    });
    const user = userEvent.setup();
    render(<SettingsForm {...defaultProps} hasPassword={true} />);
    await user.type(screen.getByLabelText(/current password/i), 'WrongPass123!');
    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    await waitFor(() => expect(mockChangePassword).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not call changePasswordAction when updateProfileAction fails', async () => {
    mockUpdateProfile.mockResolvedValue({ success: false, error: 'Server error' });
    const user = userEvent.setup();
    render(<SettingsForm {...defaultProps} hasPassword={true} />);
    await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled());
    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
