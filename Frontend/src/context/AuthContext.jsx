import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider Component.
 * Provides authentication state (user, token) and methods (login, logout, updateUser)
 * to the rest of the application via context.
 */
export const AuthProvider = ({ children }) => {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // --- AUTH EFFECTS & FUNCTIONS ---
  /**
   * Parses token on load and updates user state.
   */
  useEffect(() => {
    // In a real app, you might validate the token with the backend here.
    // For now, we'll just decode the JWT payload to get user info.
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          email: payload.sub,
          role: payload.role,
          name: payload.name,
          status: payload.status ?? 'Active',
          company_id: payload.company_id ?? null,
          attendance_access: payload.attendance_access ?? false,
          created_at: payload.created_at ?? null,
        });
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  /**
   * Logs in a user by saving the token and user data.
   */
  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  /**
   * Logs out the user by destroying token via API and clearing local state.
   */
  const logout = async () => {
    if (token) {
      try {
        await fetch('http://localhost:8000/users/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Logout API failed:", error);
      }
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * Updates current user object incrementally.
   */
  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  if (loading) {
    return <div>Loading...</div>; // or a proper loader component
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
