import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Theme modes that use animated backgrounds
const ANIMATED_THEMES = ['space', 'ocean', 'forest', 'diwali'];

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('themeMode');
            return stored || 'system';
        }
        return 'system';
    });

    const [theme, setThemeState] = useState('light');

    // Visual Preferences
    const [staticBackground, setStaticBackground] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('staticBackground') === 'true';
        }
        return false;
    });

    const [noMouseInteraction, setNoMouseInteraction] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('noMouseInteraction') === 'true';
        }
        return false;
    });

    const [hideParticles, setHideParticles] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('hideParticles') === 'true';
        }
        return false;
    });

    // Persist visual preferences
    useEffect(() => {
        localStorage.setItem('staticBackground', staticBackground);
    }, [staticBackground]);

    useEffect(() => {
        localStorage.setItem('noMouseInteraction', noMouseInteraction);
    }, [noMouseInteraction]);

    useEffect(() => {
        localStorage.setItem('hideParticles', hideParticles);
    }, [hideParticles]);

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (mode) => {
            let actualTheme = mode;

            // System theme follows OS preference
            if (mode === 'system') {
                actualTheme = mediaQuery.matches ? 'dark' : 'light';
            }
            // All animated themes use dark as base
            else if (ANIMATED_THEMES.includes(mode)) {
                actualTheme = 'dark';
            }

            // Remove all theme classes
            root.classList.remove('light', 'dark', ...ANIMATED_THEMES);

            // Add base theme class
            root.classList.add(actualTheme);

            // Add specific animated theme class if applicable
            if (ANIMATED_THEMES.includes(mode)) {
                root.classList.add(mode);
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

    // Check if current theme is an animated one
    const isAnimatedTheme = ANIMATED_THEMES.includes(themeMode);

    return (
        <ThemeContext.Provider value={{
            theme,
            themeMode,
            toggleTheme,
            setThemeMode,
            isAnimatedTheme,
            ANIMATED_THEMES,
            // Visual Preferences
            staticBackground,
            setStaticBackground,
            noMouseInteraction,
            setNoMouseInteraction,
            hideParticles,
            setHideParticles,
        }}>
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

