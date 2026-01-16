import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import QuantumBackground from '../components/shared/QuantumBackground';

const PublicLayout = () => {
    const location = useLocation();

    return (
        <div className="relative min-h-screen bg-[#0a0b14] overflow-x-hidden text-white selection:bg-indigo-500/30">
            {/* Shared Background - Persists across route changes */}
            <QuantumBackground />

            {/* Content Area */}
            <div className="relative z-10 w-full min-h-screen">
                <AnimatePresence mode="popLayout" initial={false}>
                    <Outlet />
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PublicLayout;
