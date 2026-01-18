import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiStar, FiZap, FiChevronRight, FiDroplet, FiFeather } from 'react-icons/fi';
import { GiSparkles } from 'react-icons/gi';
import { useTheme } from '../context/ThemeContext';

const THEME_CORES = [
    {
        id: 'space',
        name: 'Stars',
        icon: FiStar,
        gradient: 'from-purple-500 to-fuchsia-800',
        color: 'text-purple-400',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
    },
    {
        id: 'ocean',
        name: 'Ocean',
        icon: FiDroplet,
        gradient: 'from-cyan-400 to-blue-600',
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]'
    },
    {
        id: 'forest',
        name: 'Forest',
        icon: FiFeather,
        gradient: 'from-lime-500 to-green-700',
        color: 'text-lime-400',
        color: 'text-lime-400',
        glow: 'shadow-[0_0_15px_rgba(132,204,22,0.3)]'
    },
    {
        id: 'diwali',
        name: 'Diwali',
        icon: GiSparkles,
        gradient: 'from-orange-500 to-rose-600',
        color: 'text-orange-400',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]'
    },
];

const CompactThemeToggle = () => {
    const { theme, themeMode, setThemeMode } = useTheme();
    const [isHovered, setIsHovered] = useState(false);

    const activeCore = THEME_CORES.find(c => c.id === themeMode) || THEME_CORES[0];
    const ActiveIcon = activeCore.icon;

    // Theme-aware text/icon colors
    const textColorClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
    const secondaryColorClass = theme === 'dark' ? 'text-white/20' : 'text-slate-900/20';

    return (
        <motion.div
            className={`relative flex items-center p-1 rounded-full backdrop-blur-2xl border transition-all duration-500 group ${theme === 'dark'
                ? 'bg-white/5 border-white/10 hover:border-white/20'
                : 'bg-slate-200/50 border-slate-300 hover:border-slate-400'
                }`}
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
                                className={`p-1.5 rounded-full transition-all duration-300 relative group/btn ${isActive
                                    ? (theme === 'dark' ? 'bg-white/10' : 'bg-slate-900/10')
                                    : (theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-900/10')
                                    }`}
                                title={core.name}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-selection-ring"
                                        className={`absolute inset-0 rounded-full border ${theme === 'dark' ? 'border-white/40' : 'border-slate-900/20'
                                            } ${core.glow}`}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <CoreIcon className={`w-3.5 h-3.5 ${isActive ? textColorClass : core.color} transition-all duration-300 group-hover/btn:drop-shadow-[0_0_8px_currentColor] relative z-10`} />

                                {/* Compact Label on Hover */}
                                <div className={`absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-300 group-hover/btn:translate-y-0 translate-y-1 z-20 ${theme === 'dark' ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-slate-900'
                                    }`}>
                                    {core.name}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Subtle indicator when collapsed */}
            {!isHovered && (
                <motion.div className={`px-2 ${secondaryColorClass}`}>
                    <FiChevronRight size={10} className="animate-pulse" />
                </motion.div>
            )}
        </motion.div>
    );
};

export default CompactThemeToggle;
