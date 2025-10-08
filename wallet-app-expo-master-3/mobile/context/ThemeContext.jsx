import React, { createContext, useState } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = {
    colors: {
      primary: isDarkMode ? '#6366f1' : '#4f46e5',
      background: isDarkMode ? '#1a1a1a' : '#ffffff',
      text: isDarkMode ? '#f8fafc' : '#1e293b',
      card: isDarkMode ? '#262626' : '#f1f5f9'
    },
    toggleTheme: () => setIsDarkMode(!isDarkMode)
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
