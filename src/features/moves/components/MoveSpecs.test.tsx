import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MoveSpecs from './MoveSpecs';

describe('MoveSpecs', () => {
  it('renders nothing when all fields are null and poleTypes is empty', () => {
    const { container } = render(
      <MoveSpecs gripType={null} entry={null} duration={null} poleTypes={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only non-null fields', () => {
    render(<MoveSpecs gripType="Twisted" entry={null} duration="Short" poleTypes={[]} />);
    expect(screen.getByText('Twisted')).toBeInTheDocument();
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.queryByText('entry')).not.toBeInTheDocument();
    expect(screen.queryByText('poleSetting')).not.toBeInTheDocument();
  });

  it('renders SPIN as "Spin"', () => {
    render(<MoveSpecs gripType={null} entry={null} duration={null} poleTypes={['SPIN']} />);
    expect(screen.getByText('Spin')).toBeInTheDocument();
    expect(screen.getByText('poleSetting')).toBeInTheDocument();
  });

  it('renders STATIC as "Static"', () => {
    render(<MoveSpecs gripType={null} entry={null} duration={null} poleTypes={['STATIC']} />);
    expect(screen.getByText('Static')).toBeInTheDocument();
    expect(screen.getByText('poleSetting')).toBeInTheDocument();
  });

  it('renders STATIC+SPIN as "Static & Spin"', () => {
    render(
      <MoveSpecs gripType={null} entry={null} duration={null} poleTypes={['STATIC', 'SPIN']} />,
    );
    expect(screen.getByText('Static & Spin')).toBeInTheDocument();
    expect(screen.getByText('poleSetting')).toBeInTheDocument();
  });

  it('renders all four cards when all fields are provided', () => {
    render(<MoveSpecs gripType="Twisted" entry="Standing" duration="Short" poleTypes={['SPIN']} />);
    expect(screen.getByText('gripType')).toBeInTheDocument();
    expect(screen.getByText('entry')).toBeInTheDocument();
    expect(screen.getByText('duration')).toBeInTheDocument();
    expect(screen.getByText('poleSetting')).toBeInTheDocument();
  });

  it('renders "Specs" section label when specs are present', () => {
    render(<MoveSpecs gripType="Twisted" entry={null} duration={null} poleTypes={[]} />);
    expect(screen.getByText('specs')).toBeInTheDocument();
  });

  it('does not render "Specs" label when no specs', () => {
    const { container } = render(
      <MoveSpecs gripType={null} entry={null} duration={null} poleTypes={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
