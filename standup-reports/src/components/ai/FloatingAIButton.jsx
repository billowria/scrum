import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiZap, FiX } from 'react-icons/fi';
import AIOverlay from './AIOverlay'; // We'll create this next

/**
 * "Nano Banana" Floating AI Widget
 * 
 * Design Philosophy:
 * - "Orb" shape with liquid organic feel
 * - Neon accents (Cyan/Electric Blue)
 * - Magnetic hover interactions
 * - Breathing idle animation
 */
const FloatingAIButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end gap-4 pointer-events-none">

                {/* Connection Line (decoration) */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 40, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="w-[2px] bg-gradient-to-t from-cyan-500 to-transparent absolute right-[29px] bottom-16 rounded-full"
                        />
                    )}
                </AnimatePresence>

                {/* The Orb Button */}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="pointer-events-auto relative w-[60px] h-[60px] rounded-full flex items-center justify-center group focus:outline-none"
                >
                    {/* 1. Breathing Glow Ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-500 blur-xl opacity-40"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.4, 0.2, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* 2. Glass Container */}
                    <div className="absolute inset-0 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                        {/* Internal Shine Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        {/* Scanning Line Animation */}
                        <motion.div
                            className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 blur-[2px]"
                            animate={{
                                top: ['0%', '100%'],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                                repeatDelay: 1
                            }}
                        />
                    </div>

                    {/* 3. Icon Layer */}
                    <div className="relative z-10 text-white">
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                >
                                    <FiX size={24} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="chat"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className="relative"
                                >
                                    <FiZap size={24} className={isHovered ? 'text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''} />

                                    {/* Notification Dot */}
                                    <motion.div
                                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 1, type: "spring" }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 4. Ripple Effect on Click */}
                    {/* Implemented via pure CSS in global styles usually, or framer motion tapping */}
                </motion.button>

                {/* Floating Label (on hover) */}
                <AnimatePresence>
                    {isHovered && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, pointerEvents: 'none' }}
                            animate={{ opacity: 1, x: 0, pointerEvents: 'auto' }}
                            exit={{ opacity: 0, x: 10, pointerEvents: 'none' }}
                            className="absolute right-[70px] top-[14px] bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-xl whitespace-nowrap"
                        >
                            <span className="text-sm font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                                Sync Intelligence
                            </span>
                            {/* Little triangle arrow */}
                            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-slate-900/90" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* The Chat Screen Overlay */}
            <AIOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default FloatingAIButton;
