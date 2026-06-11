import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
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
