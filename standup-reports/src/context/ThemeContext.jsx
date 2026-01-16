import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('themeMode');
            return stored || 'system';
        }
        return 'system';
    });

    const [theme, setThemeState] = useState('light');

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (mode) => {
            let actualTheme = mode;
            if (mode === 'system') {
                actualTheme = mediaQuery.matches ? 'dark' : 'light';
            } else if (mode === 'space') {
                actualTheme = 'dark';
            }

            root.classList.remove('light', 'dark', 'space');
            root.classList.add(actualTheme);
            if (mode === 'space') {
                root.classList.add('space');
            }
            setThemeState(actualTheme);
        };

        applyTheme(themeMode);
        localStorage.setItem('themeMode', themeMode);

        const listener = () => {
            if (themeMode === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
