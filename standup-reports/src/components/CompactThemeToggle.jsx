import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiStar, FiZap, FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const THEME_CORES = [
    {
        id: 'light',
        name: 'Solaris',
        icon: FiSun,
        gradient: 'from-amber-400 to-orange-500',
        color: 'text-amber-500',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]'
    },
    {
        id: 'dark',
        name: 'Obsidian',
        icon: FiMoon,
        gradient: 'from-indigo-500 to-blue-700',
        color: 'text-indigo-400',
        glow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]'
    },
    {
        id: 'space',
        name: 'Nebula',
        icon: FiStar,
        gradient: 'from-purple-500 to-fuchsia-800',
        color: 'text-purple-400',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
    },
    {
        id: 'system',
        name: 'Neural',
        icon: FiZap,
        gradient: 'from-emerald-400 to-teal-600',
        color: 'text-emerald-400',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
    },
];

const CompactThemeToggle = () => {
    const { themeMode, setThemeMode } = useTheme();
    const [isHovered, setIsHovered] = useState(false);

    const activeCore = THEME_CORES.find(c => c.id === themeMode) || THEME_CORES[3];
    const ActiveIcon = activeCore.icon;

    return (
        <motion.div
            className="relative flex items-center p-1 rounded-full bg-slate-900/40 dark:bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all duration-500 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
        >
            {/* Active Core Pill */}
            <motion.div
                layout
                className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${activeCore.gradient} ${activeCore.glow} shadow-lg z-10`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
                <ActiveIcon className="w-3.5 h-3.5 text-white drop-shadow-md" />
                <AnimatePresence mode="wait">
                    <motion.span
                        key={activeCore.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="text-[10px] font-black uppercase tracking-[0.1em] text-white"
                    >
                        {activeCore.name}
                    </motion.span>
                </AnimatePresence>
            </motion.div>

            {/* Horizontal Expansion Drawer */}
            <motion.div
                className="flex items-center"
                animate={{ width: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="flex items-center gap-1 ml-1 pr-2">
                    {THEME_CORES.map((core) => {
                        const CoreIcon = core.icon;
                        const isActive = core.id === themeMode;
                        return (
                            <motion.button
                                key={core.id}
                                onClick={() => setThemeMode(core.id)}
                                whileHover={{ scale: 1.2, y: -1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-1.5 rounded-full transition-all duration-300 relative group/btn ${isActive ? 'bg-white/10' : 'hover:bg-white/10'}`}
                                title={core.name}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-selection-ring"
                                        className={`absolute inset-0 rounded-full border border-white/40 ${core.glow}`}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <CoreIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : core.color} transition-all duration-300 group-hover/btn:drop-shadow-[0_0_8px_currentColor] relative z-10`} />

                                {/* Compact Label on Hover */}
                                <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 backdrop-blur-md border border-white/10 text-[8px] font-black text-white uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-300 group-hover/btn:translate-y-0 translate-y-1 z-20">
                                    {core.name}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Subtle indicator when collapsed */}
            {!isHovered && (
                <motion.div className="px-2 text-white/20">
                    <FiChevronRight size={10} className="animate-pulse" />
                </motion.div>
            )}
        </motion.div>
    );
};

export default CompactThemeToggle;
