// frontend/src/context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Check localStorage first, then system preference
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Debug: Check current state
    console.log('🎨 Theme changing to:', darkMode ? 'dark' : 'light');
    console.log('HTML element before:', document.documentElement.classList.toString());
    
    // Apply theme to HTML element
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Debug: Verify after change
    console.log('HTML element after:', document.documentElement.classList.toString());
    console.log('localStorage theme:', localStorage.getItem('theme'));
  }, [darkMode]);

  const toggleDarkMode = () => {
    console.log('🔄 Toggle clicked, current:', darkMode);
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};