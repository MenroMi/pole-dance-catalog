import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './PasswordInput';

function renderInput(props?: ComponentProps<typeof PasswordInput>) {
  render(
    <label>
      Password
      <PasswordInput placeholder="••••••••" {...props} />
    </label>,
  );
  return screen.getByPlaceholderText('••••••••') as HTMLInputElement;
}

describe('PasswordInput', () => {
  it('renders type="password" by default', () => {
    const input = renderInput();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('eye button click changes type to "text"', async () => {
    const user = userEvent.setup();
    const input = renderInput();
    await user.click(screen.getByRole('button', { name: 'showPassword' }));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('second eye button click changes type back to "password"', async () => {
    const user = userEvent.setup();
    const input = renderInput();
    await user.click(screen.getByRole('button', { name: 'showPassword' }));
    await user.click(screen.getByRole('button', { name: 'hidePassword' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('eye button aria-label reflects visibility state', async () => {
    const user = userEvent.setup();
    renderInput();
    expect(screen.getByRole('button', { name: 'showPassword' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'showPassword' }));
    expect(screen.getByRole('button', { name: 'hidePassword' })).toBeInTheDocument();
  });

  it('shows caps lock warning after keydown with CapsLock active', () => {
    const input = renderInput();
    const event = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(event, 'getModifierState', {
      value: (key: string) => key === 'CapsLock',
    });
    fireEvent(input, event);
    expect(screen.getByRole('status')).toHaveTextContent('capsLockOn');
  });

  it('does not show caps lock warning after keydown without CapsLock', () => {
    const input = renderInput();
    const event = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(event, 'getModifierState', { value: () => false });
    fireEvent(input, event);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hides caps lock warning on blur', () => {
    const input = renderInput();
    const keyEvent = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(keyEvent, 'getModifierState', {
      value: (key: string) => key === 'CapsLock',
    });
    fireEvent(input, keyEvent);
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('calls props.onBlur on blur', () => {
    const onBlur = vi.fn();
    const input = renderInput({ onBlur });
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('calls props.onKeyDown on keydown', () => {
    const onKeyDown = vi.fn();
    const input = renderInput({ onKeyDown });
    fireEvent.keyDown(input);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('calls props.onKeyUp on keyup', () => {
    const onKeyUp = vi.fn();
    const input = renderInput({ onKeyUp });
    fireEvent.keyUp(input);
    expect(onKeyUp).toHaveBeenCalledTimes(1);
  });
});
