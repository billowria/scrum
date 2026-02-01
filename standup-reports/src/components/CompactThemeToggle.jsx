import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    FiStar, FiDroplet, FiFeather, FiSettings, FiImage, FiMousePointer,
    FiSquare, FiX, FiCheck, FiChevronRight, FiSun, FiMoon, FiZap,
    FiCloud, FiTarget, FiCpu, FiLayout, FiMaximize2, FiEye, FiEyeOff,
    FiActivity, FiBox, FiCompass, FiShield, FiInfo
} from 'react-icons/fi';
import { GiSparkles } from 'react-icons/gi';
import { useTheme } from '../context/ThemeContext';

const THEME_CORES = [
    {
        id: 'space',
        name: 'Stars',
        description: 'Deep Space',
        icon: FiStar,
        gradient: 'from-purple-600 via-fuchsia-600 to-indigo-700',
        color: 'text-purple-400',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
        accent: '#a855f7'
    },
    {
        id: 'ocean',
        name: 'Ocean',
        description: 'Blue Depths',
        icon: FiDroplet,
        gradient: 'from-blue-600 via-cyan-500 to-teal-400',
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
        accent: '#06b6d4'
    },
    {
        id: 'forest',
        name: 'Forest',
        description: 'Calm Nature',
        icon: FiFeather,
        gradient: 'from-emerald-600 via-green-500 to-lime-500',
        color: 'text-lime-400',
        glow: 'shadow-[0_0_15px_rgba(132,204,22,0.4)]',
        accent: '#84cc16'
    },
    {
        id: 'diwali',
        name: 'Diwali',
        description: 'Festive Lights',
        icon: GiSparkles,
        gradient: 'from-orange-600 via-rose-500 to-amber-400',
        color: 'text-orange-400',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
        accent: '#f97316'
    },
];

const SleekToggle = ({ value, onChange, activeColor, isDark }) => (
    <button
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${value ? '' : (isDark ? 'bg-zinc-700' : 'bg-gray-200')
            }`}
        style={{
            backgroundColor: value ? activeColor : undefined,
        }}
    >
        <motion.div
            className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
            animate={{
                x: value ? 16 : 0,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
    </button>
);

const GroupHeader = ({ title, isDark }) => (
    <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 pl-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {title}
    </div>
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
        disableLogoAnimation,
        setDisableLogoAnimation,
        isAnimatedTheme,
    } = useTheme();

    const [isExpanded, setIsExpanded] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [hoveredQuickTheme, setHoveredQuickTheme] = useState(null);
    const containerRef = useRef(null);
    const settingsRef = useRef(null);

    const activeCore = THEME_CORES.find(c => c.id === themeMode);

    // Config for Basic Modes (when not using a Premium Core)
    const basicModes = {
        light: {
            id: 'light',
            name: 'Light',
            icon: FiSun,
            gradient: 'from-amber-400 to-orange-400',
            glow: 'shadow-amber-500/20',
            accent: '#f59e0b'
        },
        dark: {
            id: 'dark',
            name: 'Dark',
            icon: FiMoon,
            gradient: 'from-slate-600 to-slate-800',
            glow: 'shadow-slate-500/20',
            accent: '#94a3b8'
        }
    };

    const currentTheme = activeCore || (theme === 'light' ? basicModes.light : basicModes.dark);
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target) &&
                containerRef.current && !containerRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
        };
        if (settingsOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [settingsOpen]);

    const motionSettings = [
        { id: 'motion', label: 'Animations', desc: 'Background motion', value: !staticBackground, setter: (v) => setStaticBackground(!v) },
        { id: 'particles', label: 'Particles', desc: 'Floating dots', value: !hideParticles, setter: (v) => setHideParticles(!v) },
        { id: 'logo', label: 'Logo Sync', desc: 'Icon animation', value: !disableLogoAnimation, setter: (v) => setDisableLogoAnimation(!v) },
        { id: 'mouse', label: 'Interactive', desc: 'Cursor effects', value: !noMouseInteraction, setter: (v) => setNoMouseInteraction(!v) },
    ];

    return (
        <div className="relative" ref={containerRef}>
            <LayoutGroup>
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        backgroundColor: isDark ? 'rgba(39, 39, 42, 1)' : 'rgba(255, 255, 255, 1)',
                        borderColor: isDark ? 'rgba(63, 63, 70, 1)' : 'rgba(228, 228, 231, 1)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    className="relative flex items-center p-1.5 rounded-full border shadow-sm"
                    onMouseEnter={() => setIsExpanded(true)}
                    onMouseLeave={() => !settingsOpen && setIsExpanded(false)}
                >
                    {/* Main Pill */}
                    <motion.div
                        layout
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentTheme.gradient} shadow-md z-10 overflow-hidden cursor-pointer`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        role="button"
                        tabIndex={0}
                    >
                        <motion.div layout>
                            <currentTheme.icon className="w-3.5 h-3.5 text-white" />
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="text-[11px] font-bold text-white tracking-wide whitespace-nowrap overflow-hidden"
                                >
                                    {currentTheme.name}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSettingsOpen(!settingsOpen);
                            }}
                            className="p-1 rounded-full hover:bg-white/20 transition-colors"
                            whileHover={{ rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <FiSettings className="w-3 h-3 text-white/90" />
                        </motion.button>
                    </motion.div>

                    {/* Quick Switch Strip */}
                    <AnimatePresence>
                        {isExpanded && !settingsOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                className="flex items-center gap-1 ml-2 pr-1"
                            >
                                {THEME_CORES.map(core => {
                                    const isHovered = hoveredQuickTheme === core.id;
                                    const isActive = themeMode === core.id;

                                    return (
                                        <motion.button
                                            key={core.id}
                                            onClick={() => setThemeMode(core.id)}
                                            onMouseEnter={() => setHoveredQuickTheme(core.id)}
                                            onMouseLeave={() => setHoveredQuickTheme(null)}
                                            className="relative flex items-center justify-center p-2 rounded-full transition-all"
                                            style={{
                                                backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent'
                                            }}
                                        >
                                            <core.icon className={`w-3.5 h-3.5 transition-colors ${isActive ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-700')}`} />

                                            <AnimatePresence>
                                                {isHovered && (
                                                    <motion.span
                                                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                        animate={{ opacity: 1, width: 'auto', marginLeft: 6 }}
                                                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                        className={`text-[10px] font-medium whitespace-nowrap overflow-hidden ${isDark ? 'text-white' : 'text-zinc-700'}`}
                                                    >
                                                        {core.name}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>

                                            {isActive && !isHovered && (
                                                <motion.div
                                                    layoutId="quickActiveDot"
                                                    className={`absolute -bottom-1 w-1 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-zinc-900'}`}
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* SOLID OPAQUE DROPDOWN */}
                <AnimatePresence>
                    {settingsOpen && (
                        <motion.div
                            ref={settingsRef}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute left-0 top-full mt-3 w-[600px] max-w-[90vw] rounded-3xl shadow-2xl border overflow-hidden z-[100] ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                                }`}
                        >
                            {/* Header */}
                            <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                <h2 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                    Appearance
                                </h2>
                                <button
                                    onClick={() => setSettingsOpen(false)}
                                    className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
                                >
                                    <FiX size={14} />
                                </button>
                            </div>

                            {/* 3-Column Layout */}
                            <div className="flex p-6 gap-6">

                                {/* Col 1: Basic Theme */}
                                <div className="flex-1 min-w-[140px]">
                                    <GroupHeader title="Basic Theme" isDark={isDark} />
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setThemeMode('light')}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${theme === 'light'
                                                    ? (isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900')
                                                    : (isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50')
                                                }`}
                                        >
                                            <FiSun size={14} />
                                            <span className="text-[11px] font-bold">Light Mode</span>
                                            {theme === 'light' && <FiCheck className="ml-auto" size={12} />}
                                        </button>
                                        <button
                                            onClick={() => setThemeMode('dark')}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${theme === 'dark' && !isAnimatedTheme
                                                    ? (isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900')
                                                    : (isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50')
                                                }`}
                                        >
                                            <FiMoon size={14} />
                                            <span className="text-[11px] font-bold">Dark Mode</span>
                                            {theme === 'dark' && !isAnimatedTheme && <FiCheck className="ml-auto" size={12} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Col 2: Premium Themes */}
                                <div className={`flex-1 min-w-[180px] border-l border-r px-6 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                    <GroupHeader title="Premium Themes" isDark={isDark} />
                                    <div className="space-y-2">
                                        {THEME_CORES.map(core => (
                                            <button
                                                key={core.id}
                                                onClick={() => setThemeMode(core.id)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all border ${themeMode === core.id
                                                        ? `border-${core.id === 'forest' ? 'lime' : core.id === 'diwali' ? 'orange' : core.id === 'ocean' ? 'cyan' : 'purple'}-500/30 bg-gradient-to-r ${core.gradient} text-white`
                                                        : (isDark ? 'border-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'border-transparent hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800')
                                                    }`}
                                            >
                                                <div className={`p-1.5 rounded-lg ${themeMode === core.id ? 'bg-white/20' : (isDark ? 'bg-zinc-800' : 'bg-zinc-100')}`}>
                                                    <core.icon size={12} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-[10px] font-bold">{core.name}</div>
                                                    <div className={`text-[9px] opacity-70`}>{core.description}</div>
                                                </div>
                                                {themeMode === core.id && <FiCheck size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Col 3: Animation Control */}
                                <div className="flex-1 min-w-[150px]">
                                    <GroupHeader title="Animation Control" isDark={isDark} />
                                    <div className="space-y-3 pt-1">
                                        {motionSettings.map(setting => (
                                            <div key={setting.id} className="flex items-center justify-between group">
                                                <div>
                                                    <div className={`text-[10px] font-bold transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                                        {setting.label}
                                                    </div>
                                                    <div className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                        {setting.desc}
                                                    </div>
                                                </div>
                                                <SleekToggle
                                                    value={setting.value}
                                                    onChange={setting.setter}
                                                    activeColor={currentTheme.accent}
                                                    isDark={isDark}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className={`px-6 py-3 border-t text-center ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-100 bg-zinc-50'}`}>
                                <div className="inline-flex items-center gap-1.5 text-[9px] font-medium text-zinc-400 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                    <FiCloud size={10} />
                                    <span>Preferences synced to profile</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </LayoutGroup>
        </div>
    );
};

export default CompactThemeToggle;
