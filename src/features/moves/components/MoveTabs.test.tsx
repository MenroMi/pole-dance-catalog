import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MoveTabs from './MoveTabs';

describe('MoveTabs', () => {
  it('renders three tab buttons', () => {
    render(<MoveTabs breakdown={null} />);
    expect(screen.getByRole('tab', { name: 'breakdown' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'muscles' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'safety' })).toBeInTheDocument();
  });

  it('shows Breakdown tab content by default', () => {
    render(<MoveTabs breakdown={<span>Step one</span>} />);
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'breakdown' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'muscles' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'safety' })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches to Muscles coming soon on click', async () => {
    const user = userEvent.setup();
    render(<MoveTabs breakdown={null} />);
    await user.click(screen.getByRole('tab', { name: 'muscles' }));
    expect(screen.getByText('comingSoon')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'muscles' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'breakdown' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('switches to Safety coming soon on click', async () => {
    const user = userEvent.setup();
    render(<MoveTabs breakdown={null} />);
    await user.click(screen.getByRole('tab', { name: 'safety' }));
    expect(screen.getByText('comingSoon')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'safety' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'breakdown' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders the tabpanel', () => {
    render(<MoveTabs breakdown={null} />);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('renders breakdown content in Breakdown tab', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    render(
      <MoveTabs
        breakdown={
          <button type="button" onClick={() => onSeek(30)}>
            trigger seek
          </button>
        }
      />,
    );
    await user.click(screen.getByRole('button', { name: 'trigger seek' }));
    expect(onSeek).toHaveBeenCalledWith(30);
  });

  it('navigates to next tab with ArrowRight', async () => {
    const user = userEvent.setup();
    render(<MoveTabs breakdown={null} />);
    screen.getByRole('tab', { name: 'breakdown' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'muscles' })).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around to last tab with ArrowLeft from first', async () => {
    const user = userEvent.setup();
    render(<MoveTabs breakdown={null} />);
    screen.getByRole('tab', { name: 'breakdown' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'safety' })).toHaveAttribute('aria-selected', 'true');
  });
});
