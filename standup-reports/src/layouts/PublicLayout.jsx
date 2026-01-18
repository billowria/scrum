import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import StarsBackground from '../components/shared/StarsBackground';
import OceanBackground from '../components/shared/OceanBackground';
import ForestBackground from '../components/shared/ForestBackground';
import { useTheme } from '../context/ThemeContext';

const PublicLayout = () => {
    const location = useLocation();
    const { themeMode } = useTheme();

    // Determine background color based on theme
    const bgColor = themeMode === 'light' ? 'bg-gradient-to-br from-slate-50 via-white to-blue-50' : 'bg-[#0a0b14]';
    const textColor = themeMode === 'light' ? 'text-slate-900' : 'text-white';

    return (
        <div className={`relative min-h-screen ${bgColor} overflow-x-hidden ${textColor} selection:bg-indigo-500/30`}>
            {/* Animated Theme Backgrounds */}
            {(themeMode === 'space' || themeMode === 'dark') && <StarsBackground />}
            {themeMode === 'ocean' && <OceanBackground />}
            {themeMode === 'forest' && <ForestBackground />}

            {/* Content Area */}
            <div className="relative z-10 w-full min-h-screen">
                <AnimatePresence mode="popLayout">
                    <Outlet />
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PublicLayout;
