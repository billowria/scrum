import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiDroplet, FiFeather, FiSettings, FiImage, FiMousePointer, FiSquare, FiX } from 'react-icons/fi';
import { GiSparkles } from 'react-icons/gi';
import { useTheme } from '../context/ThemeContext';

const THEME_CORES = [
    {
        id: 'space',
        name: 'Stars',
        icon: FiStar,
        gradient: 'from-purple-500 to-fuchsia-800',
        color: 'text-purple-400',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        bgHex: '#a855f7'
    },
    {
        id: 'ocean',
        name: 'Ocean',
        icon: FiDroplet,
        gradient: 'from-cyan-400 to-blue-600',
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
        bgHex: '#06b6d4'
    },
    {
        id: 'forest',
        name: 'Forest',
        icon: FiFeather,
        gradient: 'from-lime-500 to-green-700',
        color: 'text-lime-400',
        glow: 'shadow-[0_0_15px_rgba(132,204,22,0.3)]',
        bgHex: '#84cc16'
    },
    {
        id: 'diwali',
        name: 'Diwali',
        icon: GiSparkles,
        gradient: 'from-orange-500 to-rose-600',
        color: 'text-orange-400',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
        bgHex: '#f97316'
    },
];

const ToggleSwitch = ({ value, onChange, isDark }) => (
    <button
        onClick={() => onChange(!value)}
        className={`
            relative w-10 h-5 rounded-full transition-colors duration-200
            ${value ? 'bg-blue-500' : (isDark ? 'bg-slate-700' : 'bg-gray-300')}
        `}
        role="switch"
        aria-checked={value}
    >
        <motion.div
            className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
            animate={{ x: value ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
    </button>
);

const CompactThemeToggle = () => {
    const {
        theme,
        themeMode,
        setThemeMode,
        staticBackground,
        setStaticBackground,
        noMouseInteraction,
        setNoMouseInteraction,
        hideParticles,
        setHideParticles,
    } = useTheme();

    const [isExpanded, setIsExpanded] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [pillHovered, setPillHovered] = useState(false);

    const containerRef = useRef(null);
    const settingsRef = useRef(null);

    const activeCore = THEME_CORES.find(c => c.id === themeMode) || THEME_CORES[0];
    const ActiveIcon = activeCore.icon;
    const isDark = theme === 'dark';

    // Close settings on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(e.target) &&
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setSettingsOpen(false);
            }
        };

        if (settingsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [settingsOpen]);

    const settingsItems = [
        {
            id: 'staticBackground',
            label: 'Pause Animation',
            description: 'Freeze background motion',
            icon: FiImage,
            value: staticBackground,
            setValue: setStaticBackground,
        },
        {
            id: 'noMouseInteraction',
            label: 'No Mouse Effects',
            description: 'Disable cursor tracking',
            icon: FiMousePointer,
            value: noMouseInteraction,
            setValue: setNoMouseInteraction,
        },
        {
            id: 'hideParticles',
            label: 'Hide Particles',
            description: 'Remove floating elements',
            icon: FiSquare,
            value: hideParticles,
            setValue: setHideParticles,
        },
    ];

    return (
        <div className="relative" ref={containerRef}>
            {/* Main Toggle */}
            <motion.div
                className={`relative flex items-center p-1 rounded-full backdrop-blur-2xl border transition-all duration-300 ${isDark
                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                    : 'bg-slate-200/50 border-slate-300 hover:border-slate-400'
                    }`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => !settingsOpen && setIsExpanded(false)}
            >
                {/* Active Theme Pill - Clickable */}
                <motion.button
                    layout
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    onMouseEnter={() => setPillHovered(true)}
                    onMouseLeave={() => setPillHovered(false)}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${activeCore.gradient} ${activeCore.glow} shadow-lg z-10 cursor-pointer group`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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

                    {/* Gear icon on hover */}
                    <AnimatePresence>
                        {(pillHovered || settingsOpen) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <FiSettings className="w-3 h-3 text-white/80" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Theme Icons - Expanded */}
                <motion.div
                    className="flex items-center overflow-hidden"
                    animate={{
                        width: isExpanded ? 'auto' : 0,
                        opacity: isExpanded ? 1 : 0,
                        marginLeft: isExpanded ? 4 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <div className="flex items-center gap-1 pr-2">
                        {THEME_CORES.map((core) => {
                            const CoreIcon = core.icon;
                            const isActive = core.id === themeMode;
                            return (
                                <motion.button
                                    key={core.id}
                                    onClick={() => {
                                        setThemeMode(core.id);
                                        setSettingsOpen(false);
                                    }}
                                    whileHover={{ scale: 1.15, y: -1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={`relative p-1.5 rounded-full transition-all duration-200 ${isActive
                                        ? (isDark ? 'bg-white/15' : 'bg-slate-900/10')
                                        : (isDark ? 'hover:bg-white/10' : 'hover:bg-slate-900/10')
                                        }`}
                                    title={core.name}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-ring"
                                            className={`absolute inset-0 rounded-full border-2 ${core.glow}`}
                                            style={{ borderColor: `${core.bgHex}50` }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <CoreIcon
                                        className={`w-3.5 h-3.5 relative z-10 transition-all duration-200 ${isActive
                                            ? (isDark ? 'text-white' : 'text-slate-900')
                                            : core.color
                                            }`}
                                    />
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>

            {/* Settings Dropdown */}
            <AnimatePresence>
                {settingsOpen && (
                    <motion.div
                        ref={settingsRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`absolute left-0 top-full mt-2 z-50 w-64 rounded-xl shadow-xl border overflow-hidden ${isDark
                            ? 'bg-slate-900 border-slate-700'
                            : 'bg-white border-gray-200'
                            }`}
                        style={{ transformOrigin: 'top left' }}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeCore.gradient}`}
                                />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {activeCore.name} Settings
                                </span>
                            </div>
                            <button
                                onClick={() => setSettingsOpen(false)}
                                className={`p-1 rounded-md transition-colors ${isDark
                                    ? 'hover:bg-slate-700 text-slate-400'
                                    : 'hover:bg-gray-100 text-gray-400'
                                    }`}
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Settings List */}
                        <div className="p-2">
                            {settingsItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-3 rounded-lg mb-1 last:mb-0 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'
                                            }`}>
                                            <item.icon className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {item.label}
                                            </p>
                                            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'
                                                }`}>
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        value={item.value}
                                        onChange={item.setValue}
                                        isDark={isDark}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Quick Theme Switcher */}
                        <div className={`px-4 py-3 border-t ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'
                            }`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'
                                }`}>
                                Quick Switch
                            </p>
                            <div className="flex items-center gap-2">
                                {THEME_CORES.map((core) => {
                                    const CoreIcon = core.icon;
                                    const isActive = core.id === themeMode;
                                    return (
                                        <motion.button
                                            key={core.id}
                                            onClick={() => setThemeMode(core.id)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${isActive
                                                ? `bg-gradient-to-r ${core.gradient} text-white shadow-md`
                                                : (isDark
                                                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600')
                                                }`}
                                            title={core.name}
                                        >
                                            <CoreIcon className="w-3.5 h-3.5" />
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompactThemeToggle;
