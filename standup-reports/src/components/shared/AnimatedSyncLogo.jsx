import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedSyncLogo - "Static Grid Sync" Theme-Aware Edition
 * Features a high-intensity photon tracing a relay path.
 * Corner L-brackets are permanently visible and adapt to light/dark themes.
 */
const AnimatedSyncLogo = ({ size = 'md', className = '' }) => {
    const [isHovered, setIsHovered] = useState(false);

    const sizes = {
        sm: { text: 'text-[10px]', padding: '0.4rem 1.1rem', radius: 4, starSize: 2, tracking: '0.35em' },
        md: { text: 'text-xs', padding: '0.5rem 1.5rem', radius: 6, starSize: 2.5, tracking: '0.45em' },
        lg: { text: 'text-sm', padding: '0.7rem 2rem', radius: 8, starSize: 3.5, tracking: '0.55em' },
        xl: { text: 'text-xl', padding: '1.2rem 3.5rem', radius: 12, starSize: 5, tracking: '0.6em' },
    };

    const cfg = sizes[size] || sizes.md;
    const CYCLE_DURATION = 4;

    return (
        <motion.div
            className={`relative inline-flex items-center justify-center ${className} cursor-pointer group select-none`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            {/* Premium Glass Container (Theme Aware) */}
            <div
                className="relative flex items-center justify-center transition-all duration-700
          bg-white/60 dark:bg-slate-900/40 backdrop-blur-md
          border border-slate-200 dark:border-white/10"
                style={{
                    padding: cfg.padding,
                    borderRadius: cfg.radius,
                }}
            >
                {/* The SYNC Text (Theme Aware) */}
                <span
                    className={`${cfg.text} font-black relative z-10 transition-all duration-300
            text-slate-800 dark:text-white/90`}
                    style={{ letterSpacing: cfg.tracking }}
                >
                    SYNC
                </span>

                {/* The Animation Layer */}
                <div className="absolute inset-0 pointer-events-none">

                    {/* 1. Precision Photon Star */}
                    <motion.div
                        className="absolute z-20"
                        style={{
                            width: cfg.starSize,
                            height: cfg.starSize,
                            background: '#3b82f6', // Use a consistent primary blue for visibility
                            borderRadius: '50%',
                            boxShadow: `
                0 0 4px #fff, 
                0 0 8px #3b82f6
              `,
                            top: 0,
                            left: 0,
                            x: '-50%',
                            y: '-50%'
                        }}
                        animate={{
                            left: ["0%", "100%", "100%", "0%", "0%"],
                            top: ["0%", "0%", "100%", "100%", "0%"],
                        }}
                        transition={{
                            duration: CYCLE_DURATION,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />

                    {/* 2. Permanent L-Brackets with Theme Intelligence */}
                    {[
                        { top: "0%", left: "0%", delay: 0, rot: 0 },       // Corner A
                        { top: "0%", left: "100%", delay: 1, rot: 90 },    // Corner B
                        { top: "100%", left: "100%", delay: 2, rot: 180 }, // Corner C
                        { top: "100%", left: "0%", delay: 3, rot: 270 },   // Corner D
                    ].map((pos, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                top: pos.top,
                                left: pos.left,
                                transform: `translate(-50%, -50%) rotate(${pos.rot}deg)`
                            }}
                        >
                            {/* The Static Base Bracket - Uses Tailwind for Theme Support */}
                            <div
                                className="absolute w-full h-full border-t border-l 
                  border-slate-300 dark:border-white/20"
                                style={{
                                    width: cfg.starSize * 3,
                                    height: cfg.starSize * 3,
                                }}
                            />

                            {/* The Active Animated Overlay (Theme Aware) */}
                            <motion.div
                                className="absolute border-t border-l
                  border-blue-600 dark:border-white"
                                style={{
                                    width: cfg.starSize * 3,
                                    height: cfg.starSize * 3,
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [1, 1.25, 1],
                                    x: [0, -2, 0],
                                    y: [0, -2, 0],
                                    boxShadow: [
                                        '0px 0px 0px transparent',
                                        '0px 0px 8px rgba(59, 130, 246, 0.4)',
                                        '0px 0px 0px transparent'
                                    ]
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    repeatDelay: CYCLE_DURATION - 0.6,
                                    delay: pos.delay,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Synced Micro-Dot */}
                            <motion.div
                                className="absolute w-1 h-1 bg-blue-500 rounded-full"
                                style={{ opacity: 0.1 }}
                                animate={{
                                    opacity: [0.1, 0.8, 0.1],
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{
                                    duration: 0.4,
                                    repeat: Infinity,
                                    repeatDelay: CYCLE_DURATION - 0.4,
                                    delay: pos.delay,
                                }}
                            />
                        </div>
                    ))}

                </div>
            </div>

            {/* Subtle outer glow on hover */}
            <div className="absolute inset-0 rounded-lg bg-blue-500/5 blur-xl group-hover:opacity-100 opacity-0 transition-opacity duration-700 pointer-events-none" />
        </motion.div>
    );
};

export default AnimatedSyncLogo;
