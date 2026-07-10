import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SkillsCertifications from './SkillsCertifications';

const { mockUser, toastError, addSkill, getEmployees } = vi.hoisted(() => ({
  mockUser: { email: 'employee@example.com', role: 'Employee', company_id: 1 },
  toastError: vi.fn(),
  addSkill: vi.fn(),
  getEmployees: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../services/employeeService', () => ({
  employeeService: {
    getEmployees,
  },
}));

vi.mock('../../services/competencyService', () => ({
  competencyService: {
    getProfile: vi.fn(),
    listCompanyProfiles: vi.fn(),
    addSkill,
    addCertification: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: toastError,
  },
}));

describe('SkillsCertifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEmployees.mockResolvedValue([]);
    addSkill.mockResolvedValue({});
  });

  it('blocks skill submission when no matching employee profile can be resolved', async () => {
    render(<SkillsCertifications />);

    await waitFor(() => expect(getEmployees).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('Skill name'), { target: { value: 'React' } });
    fireEvent.click(screen.getByRole('button', { name: /save skill/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Unable to identify your employee profile. Please refresh and try again.'));
    expect(addSkill).not.toHaveBeenCalled();
  });

  it('saves a skill when a single employee record is available', async () => {
    getEmployees.mockResolvedValue([{ id: 42, email: 'employee@example.com', name: 'Employee Name' }]);
    render(<SkillsCertifications />);

    await waitFor(() => expect(getEmployees).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('Skill name'), { target: { value: 'React' } });
    fireEvent.click(screen.getByRole('button', { name: /save skill/i }));

    await waitFor(() => expect(addSkill).toHaveBeenCalledWith(42, expect.objectContaining({ name: 'React' }))); 
  });
});
