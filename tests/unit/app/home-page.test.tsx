import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the invitations product heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /invitations platform/i })).toBeInTheDocument();
  });
});
