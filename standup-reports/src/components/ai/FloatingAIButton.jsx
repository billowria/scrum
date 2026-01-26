import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import AIOverlay from './AIOverlay';

/**
 * Minimal Expandable AI Button
 * - Minimal circle when idle
 * - Expands to pill with "Ask Sync AI" on hover
 */
const FloatingAIButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[99999]">
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    animate={{
                        width: isHovered && !isOpen ? 140 : 48,
                        borderRadius: isHovered && !isOpen ? 24 : 24,
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                    }}
                    className="h-12 bg-gray-900 dark:bg-white shadow-lg hover:shadow-xl flex items-center justify-center overflow-hidden focus:outline-none"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                >
                    {/* Icon */}
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center justify-center"
                            >
                                <FiX size={20} className="text-white dark:text-gray-900" strokeWidth={2} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="icon"
                                className="flex items-center gap-2 px-1"
                                initial={false}
                            >
                                <motion.div
                                    animate={{ rotate: isHovered ? 360 : 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                >
                                    <HiSparkles size={20} className="text-white dark:text-gray-900" />
                                </motion.div>

                                {/* Expanding Text */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm font-medium text-white dark:text-gray-900 whitespace-nowrap pr-2"
                                        >
                                            Ask Sync AI
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* Chat Overlay */}
            <AIOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default FloatingAIButton;
