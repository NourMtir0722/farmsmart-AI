'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    console.log(`🔍 ThemeContext: initializing theme from localStorage: ${savedTheme}`);
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('🔍 ThemeContext: using system dark mode preference');
      setTheme('dark');
    } else {
      console.log('🔍 ThemeContext: using default light theme');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log(`🎨 ThemeContext: applying theme ${theme} to document`);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
    console.log(`💾 ThemeContext: saved theme ${theme} to localStorage`);
  }, [theme, mounted]);

  const toggleTheme = () => {
    console.log('🔄 ThemeContext: toggleTheme called');
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log(`🔄 ThemeContext: theme changing from ${prevTheme} to ${newTheme}`);
      return newTheme;
    });
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 