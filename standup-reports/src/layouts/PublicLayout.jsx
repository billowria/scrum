import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import StarsBackground from '../components/shared/StarsBackground';
import OceanBackground from '../components/shared/OceanBackground';
import ForestBackground from '../components/shared/ForestBackground';
import DiwaliBackground from '../components/shared/DiwaliBackground';
import { useTheme } from '../context/ThemeContext';

const PublicLayout = () => {
    const location = useLocation();
    const { themeMode, setThemeMode, ANIMATED_THEMES } = useTheme();

    // Force premium theme on public pages
    React.useEffect(() => {
        if (!ANIMATED_THEMES.includes(themeMode)) {
            // Default to ocean if current theme is not premium
            setThemeMode('ocean');
        }
    }, [themeMode, setThemeMode, ANIMATED_THEMES]);

    return (
        <div className="relative min-h-screen overflow-x-hidden selection:bg-indigo-500/30">
            {/* Content Area - Backgrounds are handled globally in App.jsx */}
            <div className="relative z-10 w-full min-h-screen">
                <AnimatePresence mode="popLayout">
                    <Outlet />
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PublicLayout;
