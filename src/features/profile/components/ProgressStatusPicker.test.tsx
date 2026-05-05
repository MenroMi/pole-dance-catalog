import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressStatusPicker from './ProgressStatusPicker';

describe('ProgressStatusPicker', () => {
  it('renders three status buttons', () => {
    render(
      <ProgressStatusPicker
        currentStatus="WANT_TO_LEARN"
        onStatusChange={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'learnStatus.WANT_TO_LEARN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'learnStatus.IN_PROGRESS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'learnStatus.LEARNED' })).toBeInTheDocument();
  });

  it('does not disable the active status button (allows unchecking)', () => {
    render(
      <ProgressStatusPicker
        currentStatus="IN_PROGRESS"
        onStatusChange={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'learnStatus.IN_PROGRESS' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'learnStatus.WANT_TO_LEARN' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'learnStatus.LEARNED' })).not.toBeDisabled();
  });

  it('calls onStatusChange with the new value when an inactive button is clicked', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(
      <ProgressStatusPicker
        currentStatus="WANT_TO_LEARN"
        onStatusChange={onStatusChange}
        isPending={false}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'learnStatus.LEARNED' }));
    expect(onStatusChange).toHaveBeenCalledWith('LEARNED');
  });

  it('calls onStatusChange with null when the active button is clicked', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(
      <ProgressStatusPicker
        currentStatus="WANT_TO_LEARN"
        onStatusChange={onStatusChange}
        isPending={false}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'learnStatus.WANT_TO_LEARN' }));
    expect(onStatusChange).toHaveBeenCalledWith(null);
  });

  it('sets aria-pressed=true only on the active status button', () => {
    render(
      <ProgressStatusPicker
        currentStatus="IN_PROGRESS"
        onStatusChange={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'learnStatus.IN_PROGRESS' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'learnStatus.WANT_TO_LEARN' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'learnStatus.LEARNED' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('disables all buttons when isPending is true regardless of status', () => {
    render(
      <ProgressStatusPicker
        currentStatus="WANT_TO_LEARN"
        onStatusChange={vi.fn()}
        isPending={true}
      />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('enables all buttons and sets aria-pressed=false when currentStatus is null', () => {
    render(
      <ProgressStatusPicker currentStatus={null} onStatusChange={vi.fn()} isPending={false} />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('calls onStatusChange when a button is clicked from null state', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(
      <ProgressStatusPicker
        currentStatus={null}
        onStatusChange={onStatusChange}
        isPending={false}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'learnStatus.IN_PROGRESS' }));
    expect(onStatusChange).toHaveBeenCalledWith('IN_PROGRESS');
  });
});
