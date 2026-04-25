import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BadgeDisplay from '../BadgeDisplay';

describe('BadgeDisplay Component', () => {
  it('renders progress text correctly', () => {
    render(<BadgeDisplay earnedBadgeIds={['first_step']} />);
    
    // There are 8 total badges in badges.ts
    expect(screen.getByText(/1 of 8 badges earned/)).toBeInTheDocument();
  });

  it('shows earned badges without grayscale and locked badges with grayscale', () => {
    render(<BadgeDisplay earnedBadgeIds={['seedling']} showAll={true} />);
    
    const badgeElements = screen.getAllByRole('img');
    
    // Seedling badge should be earned (no grayscale)
    const seedling = badgeElements.find(b => b.getAttribute('aria-label')?.includes('Seedling'));
    expect(seedling?.querySelector('.grayscale')).not.toBeInTheDocument();

    // On Fire badge should be locked (has grayscale)
    const onFire = badgeElements.find(b => b.getAttribute('aria-label')?.includes('On Fire'));
    expect(onFire?.querySelector('.grayscale')).toBeInTheDocument();
    
    expect(screen.getAllByText('🔒 Locked')).toHaveLength(7);
  });

  it('filters to only earned badges when showAll is false', () => {
    render(<BadgeDisplay earnedBadgeIds={['seedling']} showAll={false} />);
    
    const badges = screen.getAllByRole('img');
    expect(badges).toHaveLength(1);
    expect(screen.getByText('Seedling')).toBeInTheDocument();
  });

  it('shows empty state when no badges earned and showAll is false', () => {
    render(<BadgeDisplay earnedBadgeIds={[]} showAll={false} />);
    
    expect(screen.getByText(/No badges earned yet/)).toBeInTheDocument();
  });
});
