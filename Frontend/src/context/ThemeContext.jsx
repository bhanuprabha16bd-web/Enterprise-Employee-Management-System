import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * ThemeProvider Component.
 * Manages the application's light/dark theme preference globally.
 * Persists the preference in localStorage.
 */
export const ThemeProvider = ({ children }) => {
  // --- THEME STATE ---
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // --- THEME EFFECTS & FUNCTIONS ---

  /**
   * Syncs theme changes to localStorage and the document root element.
   */
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /**
   * Toggles the theme between light and dark modes.
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
