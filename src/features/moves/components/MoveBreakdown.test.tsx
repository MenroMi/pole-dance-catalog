import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { StepItem } from '../types';

import MoveBreakdown from './MoveBreakdown';

const noop = () => {};
const defaultProps = { coachNote: null, coachNoteAuthor: null };

describe('MoveBreakdown', () => {
  it('renders nothing when stepsData is empty', () => {
    const { container } = render(<MoveBreakdown stepsData={[]} onSeek={noop} {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the correct number of steps', () => {
    const stepsData: StepItem[] = [
      { text: 'Grip the pole' },
      { text: 'Kick out' },
      { text: 'Extend' },
    ];
    render(<MoveBreakdown stepsData={stepsData} onSeek={noop} {...defaultProps} />);
    expect(screen.getByText('Grip the pole')).toBeInTheDocument();
    expect(screen.getByText('Kick out')).toBeInTheDocument();
    expect(screen.getByText('Extend')).toBeInTheDocument();
  });

  it('renders step numbers padded to two digits', () => {
    render(<MoveBreakdown stepsData={[{ text: 'First step' }]} onSeek={noop} {...defaultProps} />);
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('renders timestamp badge for steps with a timestamp', () => {
    const stepsData: StepItem[] = [{ text: 'Kick out', timestamp: 45 }];
    render(<MoveBreakdown stepsData={stepsData} onSeek={noop} {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'seekTo' })).toBeInTheDocument();
    expect(screen.getByText('0:45')).toBeInTheDocument();
  });

  it('does not render timestamp badge for steps without a timestamp', () => {
    const stepsData: StepItem[] = [{ text: 'Grip the pole' }];
    render(<MoveBreakdown stepsData={stepsData} onSeek={noop} {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('formats timestamp correctly for minutes and seconds', () => {
    const stepsData: StepItem[] = [{ text: 'Step', timestamp: 90 }];
    render(<MoveBreakdown stepsData={stepsData} onSeek={noop} {...defaultProps} />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('calls onSeek with the correct seconds when badge is clicked', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    const stepsData: StepItem[] = [{ text: 'Kick out', timestamp: 45 }];
    render(<MoveBreakdown stepsData={stepsData} onSeek={onSeek} {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'seekTo' }));
    expect(onSeek).toHaveBeenCalledWith(45);
    expect(onSeek).toHaveBeenCalledTimes(1);
  });

  it('does not call onSeek when clicking a step without a timestamp', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    const stepsData: StepItem[] = [{ text: 'Grip the pole' }];
    render(<MoveBreakdown stepsData={stepsData} onSeek={onSeek} {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('renders coach note and author when provided', () => {
    render(
      <MoveBreakdown
        stepsData={[{ text: 'Step' }]}
        onSeek={noop}
        coachNote="Keep your eyes high"
        coachNoteAuthor="Studio Maja, Zagreb"
      />,
    );
    expect(screen.getByText(/Keep your eyes high/)).toBeInTheDocument();
    expect(screen.getByText(/Studio Maja, Zagreb/)).toBeInTheDocument();
  });

  it('does not render coach note aside when coachNote is null', () => {
    render(
      <MoveBreakdown
        stepsData={[{ text: 'Step' }]}
        onSeek={noop}
        coachNote={null}
        coachNoteAuthor={null}
      />,
    );
    expect(screen.queryByTestId('coach-note-label')).not.toBeInTheDocument();
  });

  it('renders coach note without author line when coachNoteAuthor is null', () => {
    render(
      <MoveBreakdown
        stepsData={[{ text: 'Step' }]}
        onSeek={noop}
        coachNote="Keep your eyes high"
        coachNoteAuthor={null}
      />,
    );
    expect(screen.getByText(/Keep your eyes high/)).toBeInTheDocument();
    expect(screen.queryByText(/^—/)).not.toBeInTheDocument();
  });
});
