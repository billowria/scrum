import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import AIOverlay from './AIOverlay';

/**
 * AI Button for Navbar - Transparent, Unique, Premium
 * - Transparent background with subtle glass effect
 * - Always visible text "Ask Sync AI"
 * - Advanced "Border Beam" animation
 */
const AIButton = ({ isOpen, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="relative group">
            <motion.button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                layout
                className="relative h-9 px-4 flex items-center gap-3 rounded-full transition-all duration-500 bg-transparent group-hover:scale-[1.02] active:scale-[0.98]"
            >
                {/* 1. Transparent Glass Background */}
                <div
                    className={`absolute inset-0 rounded-full border bg-white/0 backdrop-blur-[0px] transition-all duration-500
                    ${isHovered
                            ? 'border-cyan-500/30 bg-white/5 dark:bg-white/5 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'border-slate-200/40 dark:border-white/10'
                        }
                    ${isOpen ? 'border-cyan-500/50 bg-cyan-500/10 dark:bg-cyan-500/10' : ''}
                    `}
                />

                {/* 2. Breathing Blue Glow Border - Always Active */}
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    animate={{
                        boxShadow: [
                            '0 0 0px rgba(6, 182, 212, 0)',
                            '0 0 12px rgba(6, 182, 212, 0.4)',
                            '0 0 0px rgba(6, 182, 212, 0)'
                        ],
                        borderWidth: '1px',
                        borderColor: [
                            'rgba(6, 182, 212, 0.1)',
                            'rgba(6, 182, 212, 0.6)',
                            'rgba(6, 182, 212, 0.1)'
                        ]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* 3. Content - Always Visible Text */}
                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center">
                        <HiSparkles
                            size={16}
                            className={`text-cyan-500 transition-all duration-500 
                             ${isHovered ? 'rotate-12 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'opacity-80'}
                             ${isOpen ? 'animate-pulse' : ''}`}
                        />
                    </div>

                    <span className={`text-[13px] font-[600] tracking-wide transition-all duration-500 whitespace-nowrap text-gray-900 dark:text-white opacity-100
                        ${isOpen ? '!text-cyan-500' : ''}
                    `}>
                        Ask Sync AI
                    </span>
                </div>

                {/* 4. Bottom Active Indicator Line (Premium Touch) */}
                {isOpen && (
                    <motion.div
                        layoutId="active-ai-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
                    />
                )}
            </motion.button>
        </div>
    );
};

const FloatingAIButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* The overlay is now controlled centrally or we can keep it here but the button is rendered in the navbar */}
            {/* We will export AIButton separately for its use in Navbar */}
            <AIOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export { AIButton };
export default FloatingAIButton;
