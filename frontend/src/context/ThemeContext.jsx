import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  // Efek untuk selalu menerapkan tema gelap pada mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Menyediakan nilai darkMode: true secara statis
  // Fungsi toggleDarkMode dihilangkan
  return (
    <ThemeContext.Provider value={{ darkMode: true }}>
      {children}
    </ThemeContext.Provider>
  );
};
