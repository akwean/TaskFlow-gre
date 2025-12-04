import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

// Basic render test to ensure component mounts
describe('Dashboard', () => {
  vi.mock('@/lib/api', () => ({ default: { get: vi.fn(async () => ({ data: [] })) } }));
  // Mock AuthContext hook to avoid loading UI
  vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'Tester' }, loading: false, logout: vi.fn() }) }));
  vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'Tester' }, loading: false, logout: vi.fn() }) }));
  it('renders header', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(await screen.findByText(/TaskFlow/i)).toBeInTheDocument();
  });
});
