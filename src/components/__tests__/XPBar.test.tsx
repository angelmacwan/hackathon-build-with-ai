import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import XPBar from '../XPBar';

describe('XPBar Component', () => {
  it('renders correctly with given XP', () => {
    // 500 XP = Lv.2 according to default xp.ts logic (0-499: Lv 1, 500-1499: Lv 2)
    render(<XPBar xp={500} />);
    
    expect(screen.getByText(/Lv\.2/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders in compact mode', () => {
    render(<XPBar xp={500} compact={true} />);
    
    // In compact mode, the main Lv text is smaller and formatted differently
    expect(screen.getByText('Lv.2 · 0%')).toBeInTheDocument();
    // The detailed XP info should NOT be present
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it('calculates progress correctly', () => {
    // Level 2 starts at 500, Level 3 starts at 1200. Total span = 700.
    // 1000 XP means 500 into Lv 2. 500/700 = 71.4% -> 71%.
    render(<XPBar xp={1000} />);
    
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '71');
  });
});
