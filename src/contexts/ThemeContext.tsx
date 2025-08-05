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
    console.log('🔍 ThemeContext: component mounted, initializing theme...');
    
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    console.log(`🔍 ThemeContext: localStorage theme value: "${savedTheme}"`);
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      console.log(`🔍 ThemeContext: using saved theme: ${savedTheme}`);
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('🔍 ThemeContext: using system dark mode preference');
      setTheme('dark');
    } else {
      console.log('🔍 ThemeContext: using default light theme');
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      console.log('🔍 ThemeContext: not mounted yet, skipping theme application');
      return;
    }
    
    console.log(`🎨 ThemeContext: applying theme "${theme}" to document`);
    const root = document.documentElement;
    const previousClasses = root.className;
    console.log(`🎨 ThemeContext: previous document classes: "${previousClasses}"`);
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    const newClasses = root.className;
    console.log(`🎨 ThemeContext: new document classes: "${newClasses}"`);
    
    localStorage.setItem('theme', theme);
    console.log(`💾 ThemeContext: saved theme "${theme}" to localStorage`);
    
    // Verify the change was applied
    const currentTheme = localStorage.getItem('theme');
    console.log(`💾 ThemeContext: verification - localStorage now contains: "${currentTheme}"`);
  }, [theme, mounted]);

  const toggleTheme = () => {
    console.log('🔄 ThemeContext: toggleTheme called');
    console.log(`🔄 ThemeContext: current theme before toggle: "${theme}"`);
    
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log(`🔄 ThemeContext: theme changing from "${prevTheme}" to "${newTheme}"`);
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