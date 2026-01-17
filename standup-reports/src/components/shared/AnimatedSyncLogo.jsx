import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedSyncLogo - Border Tracing Stars Design
 * Clean SYNC text with visible stars orbiting along the rectangular border
 */
const AnimatedSyncLogo = ({ size = 'md', showText = true, className = '' }) => {
    const [isHovered, setIsHovered] = useState(false);

    const sizes = {
        sm: { text: 'text-xs', padding: 'px-2.5 py-1.5' },
        md: { text: 'text-sm', padding: 'px-3.5 py-2' },
        lg: { text: 'text-base', padding: 'px-4 py-2.5' },
        xl: { text: 'text-xl', padding: 'px-5 py-3' },
    };

    const config = sizes[size] || sizes.md;

    // Star configuration - each travels the full rectangular perimeter
    const stars = [
        { duration: 4, delay: 0, color: '#818cf8', size: 4 },      // Indigo
        { duration: 4, delay: 1, color: '#a78bfa', size: 3 },      // Violet
        { duration: 4, delay: 2, color: '#c084fc', size: 3 },      // Purple
        { duration: 4, delay: 3, color: '#67e8f9', size: 2.5 },    // Cyan accent
    ];

    return (
        <motion.div
            className={`relative inline-flex ${className} cursor-pointer select-none`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Main Container */}
            <div
                className={`relative ${config.padding} rounded-lg`}
                style={{
                    background: isHovered
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.06) 100%)'
                        : 'rgba(99, 102, 241, 0.03)',
                    transition: 'background 0.3s ease',
                }}
            >
                {/* Static Border */}
                <div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                />

                {/* Orbiting Stars - Travel along rectangular border */}
                {stars.map((star, index) => (
                    <motion.div
                        key={index}
                        className="absolute pointer-events-none"
                        style={{
                            width: star.size,
                            height: star.size,
                            borderRadius: '50%',
                            background: star.color,
                            boxShadow: `0 0 ${star.size * 2}px ${star.size / 2}px ${star.color}, 0 0 ${star.size * 4}px ${star.size}px ${star.color}50`,
                        }}
                        animate={{
                            // Rectangular path: top-left → top-right → bottom-right → bottom-left → back
                            offsetDistance: ['0%', '100%'],
                        }}
                        transition={{
                            duration: star.duration,
                            delay: star.delay,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        initial={{
                            offsetPath: 'path("M 6 0 L calc(100% - 6px) 0 Q 100% 0 100% 6 L 100% calc(100% - 6px) Q 100% 100% calc(100% - 6px) 100% L 6 100% Q 0 100% 0 calc(100% - 6px) L 0 6 Q 0 0 6 0")',
                            offsetRotate: '0deg',
                        }}
                    />
                ))}

                {/* Fallback: CSS-based border animation for better browser support */}
                <style>{`
                    @keyframes borderTrace1 {
                        0%, 100% { top: -2px; left: -2px; }
                        25% { top: -2px; left: calc(100% - 2px); }
                        50% { top: calc(100% - 2px); left: calc(100% - 2px); }
                        75% { top: calc(100% - 2px); left: -2px; }
                    }
                    @keyframes borderTrace2 {
                        0%, 100% { top: -2px; left: calc(100% - 2px); }
                        25% { top: calc(100% - 2px); left: calc(100% - 2px); }
                        50% { top: calc(100% - 2px); left: -2px; }
                        75% { top: -2px; left: -2px; }
                    }
                    @keyframes borderTrace3 {
                        0%, 100% { top: calc(100% - 2px); left: calc(100% - 2px); }
                        25% { top: calc(100% - 2px); left: -2px; }
                        50% { top: -2px; left: -2px; }
                        75% { top: -2px; left: calc(100% - 2px); }
                    }
                    @keyframes borderTrace4 {
                        0%, 100% { top: calc(100% - 2px); left: -2px; }
                        25% { top: -2px; left: -2px; }
                        50% { top: -2px; left: calc(100% - 2px); }
                        75% { top: calc(100% - 2px); left: calc(100% - 2px); }
                    }
                    @keyframes starPulse {
                        0%, 100% { transform: scale(1); opacity: 0.9; }
                        50% { transform: scale(1.3); opacity: 1; }
                    }
                `}</style>

                {/* Star 1 - Indigo */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#818cf8',
                        boxShadow: '0 0 6px 2px #818cf8, 0 0 12px 4px rgba(129, 140, 248, 0.4)',
                        animation: 'borderTrace1 4s linear infinite, starPulse 2s ease-in-out infinite',
                    }}
                />

                {/* Star 2 - Violet */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: '#a78bfa',
                        boxShadow: '0 0 5px 1.5px #a78bfa, 0 0 10px 3px rgba(167, 139, 250, 0.4)',
                        animation: 'borderTrace2 4s linear infinite, starPulse 2.2s ease-in-out infinite',
                    }}
                />

                {/* Star 3 - Purple */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: '#c084fc',
                        boxShadow: '0 0 5px 1.5px #c084fc, 0 0 10px 3px rgba(192, 132, 252, 0.4)',
                        animation: 'borderTrace3 4s linear infinite, starPulse 1.8s ease-in-out infinite',
                    }}
                />

                {/* Star 4 - Cyan */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: 2.5,
                        height: 2.5,
                        borderRadius: '50%',
                        background: '#67e8f9',
                        boxShadow: '0 0 4px 1px #67e8f9, 0 0 8px 2px rgba(103, 232, 249, 0.4)',
                        animation: 'borderTrace4 4s linear infinite, starPulse 2.5s ease-in-out infinite',
                    }}
                />

                {/* Inner Glow on Hover */}
                <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        boxShadow: 'inset 0 0 15px rgba(99, 102, 241, 0.12)',
                    }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* SYNC Text */}
                <motion.span
                    className={`${config.text} font-semibold tracking-widest relative z-10`}
                    style={{
                        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '0.18em',
                    }}
                    animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    SYNC
                </motion.span>
            </div>
        </motion.div>
    );
};

export default AnimatedSyncLogo;
