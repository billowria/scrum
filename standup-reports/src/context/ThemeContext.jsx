import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ThemeContext = createContext();

// Theme modes that use animated backgrounds
const ANIMATED_THEMES = ['space', 'ocean', 'forest', 'diwali'];

export const ThemeProvider = ({ children }) => {
    // Initial states from localStorage as fallback
    const [themeMode, setThemeMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('themeMode') || 'ocean';
        }
        return 'ocean';
    });

    const [theme, setThemeState] = useState('light');

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

    const [disableLogoAnimation, setDisableLogoAnimation] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('disableLogoAnimation') === 'true';
        }
        return false;
    });

    const [userId, setUserId] = useState(null);

    // Fetch user on mount and subscribe to auth changes
    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                setUserId(session.user.id);
                fetchUserSettings(session.user.id);
            }
        };

        getInitialUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.id) {
                setUserId(session.user.id);
                fetchUserSettings(session.user.id);
            } else {
                setUserId(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserSettings = async (uid) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('theme_settings')
                .eq('id', uid)
                .single();

            if (data?.theme_settings) {
                const settings = data.theme_settings;
                if (settings.themeMode) setThemeMode(settings.themeMode);
                if (settings.staticBackground !== undefined) setStaticBackground(settings.staticBackground);
                if (settings.noMouseInteraction !== undefined) setNoMouseInteraction(settings.noMouseInteraction);
                if (settings.hideParticles !== undefined) setHideParticles(settings.hideParticles);
                if (settings.disableLogoAnimation !== undefined) setDisableLogoAnimation(settings.disableLogoAnimation);
            }
        } catch (error) {
            console.error('Error fetching theme settings:', error);
        }
    };

    // Persist to Supabase with debounce
    useEffect(() => {
        if (!userId) return;

        const timer = setTimeout(async () => {
            const settings = {
                themeMode,
                staticBackground,
                noMouseInteraction,
                hideParticles,
                disableLogoAnimation
            };

            await supabase
                .from('users')
                .update({ theme_settings: settings })
                .eq('id', userId);
        }, 1000);

        return () => clearTimeout(timer);
    }, [userId, themeMode, staticBackground, noMouseInteraction, hideParticles, disableLogoAnimation]);

    // LocalStorage persistence as a secondary fallback
    useEffect(() => {
        localStorage.setItem('themeMode', themeMode);
        localStorage.setItem('staticBackground', staticBackground);
        localStorage.setItem('noMouseInteraction', noMouseInteraction);
        localStorage.setItem('hideParticles', hideParticles);
        localStorage.setItem('disableLogoAnimation', disableLogoAnimation);
    }, [themeMode, staticBackground, noMouseInteraction, hideParticles, disableLogoAnimation]);

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (mode) => {
            let actualTheme = mode;

            if (mode === 'system') {
                actualTheme = mediaQuery.matches ? 'dark' : 'light';
            } else if (ANIMATED_THEMES.includes(mode)) {
                actualTheme = 'dark';
            }

            root.classList.remove('light', 'dark', ...ANIMATED_THEMES);
            root.classList.add(actualTheme);
            if (ANIMATED_THEMES.includes(mode)) {
                root.classList.add(mode);
            }

            setThemeState(actualTheme);
        };

        applyTheme(themeMode);

        const listener = () => {
            if (themeMode === 'system') applyTheme('system');
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
            disableLogoAnimation,
            setDisableLogoAnimation,
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

