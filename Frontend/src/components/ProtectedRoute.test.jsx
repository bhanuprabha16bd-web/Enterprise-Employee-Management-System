import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

/**
 * Unit tests for the ProtectedRoute component.
 * Mocks the AuthContext to verify correct redirection behaviors based on user status and authentication.
 */
describe('ProtectedRoute', () => {
  it('redirects suspended users to the suspended page', () => {
    useAuth.mockReturnValue({
      user: { role: 'User', status: 'Suspended' },
      token: 'token-value',
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<div>Dashboard</div>} />
          </Route>
          <Route path="/suspended" element={<div>Account Suspended</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Account Suspended')).toBeInTheDocument();
  });

  it('redirects inactive users to the deactivated page', () => {
    useAuth.mockReturnValue({
      user: { role: 'User', status: 'Inactive' },
      token: 'token-value',
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<div>Dashboard</div>} />
          </Route>
          <Route path="/deactivated" element={<div>Account Deactivated</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Account Deactivated')).toBeInTheDocument();
  });
});
