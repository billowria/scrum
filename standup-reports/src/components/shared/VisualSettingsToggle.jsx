import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiImage, FiMousePointer, FiSquare, FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

/**
 * VisualSettingsToggle - Compact settings button with popover for visual preferences.
 * Allows users to toggle: Static Background, No Mouse Interaction, No Glassmorphic.
 */
const VisualSettingsToggle = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);
    const buttonRef = useRef(null);

    const {
        staticBackground,
        setStaticBackground,
        noMouseInteraction,
        setNoMouseInteraction,
        noGlassmorphic,
        setNoGlassmorphic,
        theme,
    } = useTheme();

    const isDark = theme === 'dark';

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleSettings = [
        {
            id: 'staticBackground',
            label: 'Static Background',
            description: 'Pause animated backgrounds',
            icon: FiImage,
            value: staticBackground,
            setValue: setStaticBackground,
        },
        {
            id: 'noMouseInteraction',
            label: 'No Mouse Effects',
            description: 'Disable hover parallax',
            icon: FiMousePointer,
            value: noMouseInteraction,
            setValue: setNoMouseInteraction,
        },
        {
            id: 'noGlassmorphic',
            label: 'Solid Backgrounds',
            description: 'Remove blur/transparency',
            icon: FiSquare,
            value: noGlassmorphic,
            setValue: setNoGlassmorphic,
        },
    ];

    return (
        <div className={`relative ${className}`}>
            {/* Compact Settings Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    p-2 rounded-lg transition-all duration-200
                    ${isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }
                    ${isOpen ? (isDark ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-700') : ''}
                `}
                aria-label="Visual Settings"
                title="Visual Settings"
            >
                <FiSettings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Popover Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={popoverRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`
                            absolute right-0 top-full mt-2 z-50
                            w-72 rounded-xl shadow-xl border
                            ${isDark
                                ? 'bg-slate-900 border-slate-700'
                                : 'bg-white border-gray-200'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className={`
                            flex items-center justify-between px-4 py-3 border-b
                            ${isDark ? 'border-slate-700' : 'border-gray-100'}
                        `}>
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Visual Settings
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={`p-1 rounded-md transition-colors ${isDark
                                    ? 'hover:bg-slate-700 text-slate-400'
                                    : 'hover:bg-gray-100 text-gray-400'
                                    }`}
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Toggle Items */}
                        <div className="p-2">
                            {toggleSettings.map((setting) => (
                                <div
                                    key={setting.id}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg mb-1 last:mb-0
                                        ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            p-2 rounded-lg
                                            ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                                        `}>
                                            <setting.icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {setting.label}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                                {setting.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => setting.setValue(!setting.value)}
                                        className={`
                                            relative w-11 h-6 rounded-full transition-colors duration-200
                                            ${setting.value
                                                ? 'bg-blue-500'
                                                : (isDark ? 'bg-slate-700' : 'bg-gray-300')
                                            }
                                        `}
                                        aria-checked={setting.value}
                                        role="switch"
                                    >
                                        <motion.div
                                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                            animate={{ x: setting.value ? 20 : 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Footer Hint */}
                        <div className={`
                            px-4 py-2 border-t text-center
                            ${isDark ? 'border-slate-700' : 'border-gray-100'}
                        `}>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                Settings are saved automatically
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VisualSettingsToggle;
