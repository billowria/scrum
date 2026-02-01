import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * AnimatedSyncLogo - Premium Theme-Aware Edition
 * Features dynamic colors and animations based on active theme.
 */
const AnimatedSyncLogo = ({ size = 'md', className = '', showText = true }) => {
    const [isHovered, setIsHovered] = useState(false);
    const controls = useAnimation();
    const { themeMode, theme, disableLogoAnimation } = useTheme();

    // Theme-specific color configurations
    const themeConfigs = {
        space: {
            primary: '#a855f7',
            secondary: '#c4b5fd',
            accent: '#e879f9',
            glow: 'rgba(168, 85, 247, 0.6)',
            textGradient: 'linear-gradient(135deg, #a855f7, #e879f9, #c4b5fd)',
            photonShadow: '0 0 6px #fff, 0 0 12px #a855f7, 0 0 20px rgba(168, 85, 247, 0.5)',
            bracketBorder: 'border-purple-500 dark:border-purple-400',
            dotColor: 'bg-purple-500',
        },
        ocean: {
            primary: '#06b6d4',
            secondary: '#67e8f9',
            accent: '#22d3ee',
            glow: 'rgba(6, 182, 212, 0.6)',
            textGradient: 'linear-gradient(135deg, #06b6d4, #22d3ee, #67e8f9)',
            photonShadow: '0 0 6px #fff, 0 0 12px #06b6d4, 0 0 20px rgba(6, 182, 212, 0.5)',
            bracketBorder: 'border-cyan-500 dark:border-cyan-400',
            dotColor: 'bg-cyan-500',
        },
        forest: {
            primary: '#84cc16',
            secondary: '#bef264',
            accent: '#a3e635',
            glow: 'rgba(132, 204, 22, 0.6)',
            textGradient: 'linear-gradient(135deg, #84cc16, #a3e635, #bef264)',
            photonShadow: '0 0 6px #fff, 0 0 12px #84cc16, 0 0 20px rgba(132, 204, 22, 0.5)',
            bracketBorder: 'border-lime-500 dark:border-lime-400',
            dotColor: 'bg-lime-500',
        },
        diwali: {
            primary: '#f97316',
            secondary: '#fbbf24',
            accent: '#fb923c',
            glow: 'rgba(249, 115, 22, 0.6)',
            textGradient: 'linear-gradient(135deg, #f97316, #fbbf24, #fb923c)',
            photonShadow: '0 0 6px #fff, 0 0 12px #f97316, 0 0 20px rgba(249, 115, 22, 0.5)',
            bracketBorder: 'border-orange-500 dark:border-orange-400',
            dotColor: 'bg-orange-500',
        },
        default: {
            primary: '#3b82f6',
            secondary: '#60a5fa',
            accent: '#93c5fd',
            glow: 'rgba(59, 130, 246, 0.6)',
            textGradient: 'linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)',
            photonShadow: '0 0 4px #fff, 0 0 8px #3b82f6',
            bracketBorder: 'border-blue-600 dark:border-blue-400',
            dotColor: 'bg-blue-500',
        }
    };

    const currentConfig = themeConfigs[themeMode] || themeConfigs.default;
    const isDark = theme === 'dark';

    const sizes = {
        sm: { text: 'text-[10px]', padding: '0.4rem 1.1rem', radius: 4, starSize: 2, tracking: '0.35em' },
        md: { text: 'text-xs', padding: '0.5rem 1.5rem', radius: 6, starSize: 2.5, tracking: '0.45em' },
        lg: { text: 'text-sm', padding: '0.7rem 2rem', radius: 8, starSize: 3.5, tracking: '0.55em' },
        xl: { text: 'text-xl', padding: '1.2rem 3.5rem', radius: 12, starSize: 5, tracking: '0.6em' },
    };

    const cfg = sizes[size] || sizes.md;

    // Faster cycle for premium themes, slower for default
    const CYCLE_DURATION = ['space', 'ocean', 'forest', 'diwali'].includes(themeMode) ? 2.5 : 3;

    useEffect(() => {
        if (disableLogoAnimation) {
            controls.stop();
        } else {
            controls.start("star");
            controls.start("bracket");
            controls.start("dot");
        }
    }, [controls, themeMode, disableLogoAnimation]);

    const variants = {
        star: {
            left: ["0%", "100%", "100%", "0%", "0%"],
            top: ["0%", "0%", "100%", "100%", "0%"],
            transition: {
                duration: CYCLE_DURATION,
                repeat: Infinity,
                ease: "linear",
            }
        },
        bracket: (delay) => ({
            opacity: [0, 1, 0],
            scale: [1, 1.3, 1],
            x: [0, -3, 0],
            y: [0, -3, 0],
            boxShadow: [
                '0px 0px 0px transparent',
                `0px 0px 10px ${currentConfig.glow}`,
                '0px 0px 0px transparent'
            ],
            transition: {
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: CYCLE_DURATION - 0.5,
                delay: delay,
                ease: "easeInOut"
            }
        }),
        dot: (delay) => ({
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.8, 1],
            transition: {
                duration: 0.4,
                repeat: Infinity,
                repeatDelay: CYCLE_DURATION - 0.4,
                delay: delay,
            }
        })
    };

    // Calculate corner delays based on cycle
    const cornerDelays = [0, CYCLE_DURATION / 4, CYCLE_DURATION / 2, (3 * CYCLE_DURATION) / 4];

    return (
        <motion.div
            className={`relative inline-flex items-center justify-center ${className} cursor-pointer group select-none`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            {/* Premium Glass Container */}
            <div
                className={`relative flex items-center justify-center transition-[background-color,border-color] duration-500
                    ${isDark ? 'bg-slate-900/50' : 'bg-white/70'} backdrop-blur-md
                    border ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                style={{
                    padding: cfg.padding,
                    borderRadius: cfg.radius,
                }}
            >
                {/* The SYNC Text with Theme Gradient */}
                {showText && (
                    <span
                        key={themeMode}
                        className={`${cfg.text} font-black relative z-10`}
                        style={{
                            letterSpacing: cfg.tracking,
                            backgroundImage: currentConfig.textGradient,
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            color: 'transparent',
                            display: 'inline-block',
                        }}
                    >
                        SYNC
                    </span>
                )}

                {/* Animation Layer */}
                <div className="absolute inset-0 pointer-events-none">

                    {/* Photon Star with Theme Colors - Only show if not disabled */}
                    {!disableLogoAnimation && (
                        <motion.div
                            className="absolute z-20"
                            style={{
                                width: cfg.starSize,
                                height: cfg.starSize,
                                background: currentConfig.primary,
                                borderRadius: '50%',
                                boxShadow: currentConfig.photonShadow,
                                top: 0,
                                left: 0,
                                x: '-50%',
                                y: '-50%'
                            }}
                            initial={{ left: "0%", top: "0%" }}
                            animate={controls}
                            variants={{ star: variants.star }}
                        />
                    )}

                    {/* Comet Tail for Premium Themes */}
                    {['space', 'ocean', 'forest', 'diwali'].includes(themeMode) && !disableLogoAnimation && (
                        <motion.div
                            className="absolute z-19"
                            style={{
                                width: cfg.starSize * 4,
                                height: cfg.starSize * 0.8,
                                background: `linear-gradient(90deg, transparent, ${currentConfig.primary}40, ${currentConfig.primary}80)`,
                                borderRadius: cfg.starSize,
                                top: 0,
                                left: 0,
                                x: '-100%',
                                y: '-50%',
                                opacity: 0.7,
                            }}
                            initial={{ left: "0%", top: "0%" }}
                            animate={controls}
                            variants={{ star: variants.star }}
                        />
                    )}

                    {/* L-Brackets with Theme Colors */}
                    {[
                        { top: "0%", left: "0%", delay: cornerDelays[0], rot: 0 },
                        { top: "0%", left: "100%", delay: cornerDelays[1], rot: 90 },
                        { top: "100%", left: "100%", delay: cornerDelays[2], rot: 180 },
                        { top: "100%", left: "0%", delay: cornerDelays[3], rot: 270 },
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
                            {/* Static Base Bracket */}
                            <div
                                className={`absolute w-full h-full border-t border-l
                                    ${isDark ? 'border-white/20' : 'border-slate-300'}`}
                                style={{
                                    width: cfg.starSize * 3,
                                    height: cfg.starSize * 3,
                                }}
                            />

                            {/* Animated Overlay with Theme Color */}
                            <motion.div
                                className={`absolute border-t-2 border-l-2 ${currentConfig.bracketBorder}`}
                                style={{
                                    width: cfg.starSize * 3,
                                    height: cfg.starSize * 3,
                                    borderColor: currentConfig.primary,
                                }}
                                initial={false}
                                animate={disableLogoAnimation ? {
                                    opacity: 1,
                                    scale: 1.3,
                                    boxShadow: `0px 0px 10px ${currentConfig.glow}`,
                                    x: -3,
                                    y: -3
                                } : controls}
                                custom={pos.delay}
                                variants={{ bracket: variants.bracket(pos.delay) }}
                            />

                            {/* Synced Micro-Dot */}
                            {!disableLogoAnimation && (
                                <motion.div
                                    className={`absolute w-1.5 h-1.5 rounded-full ${currentConfig.dotColor}`}
                                    style={{
                                        opacity: 0.2,
                                        boxShadow: `0 0 4px ${currentConfig.primary}`
                                    }}
                                    initial={{ opacity: 0.2, scale: 1 }}
                                    animate={controls}
                                    custom={pos.delay}
                                    variants={{ dot: variants.dot(pos.delay) }}
                                />
                            )}
                        </div>
                    ))}

                </div>
            </div>

            {/* Outer Glow on Hover - Theme Colored */}
            <motion.div
                className="absolute inset-0 rounded-lg blur-xl pointer-events-none"
                style={{
                    background: currentConfig.glow,
                    opacity: isHovered ? 0.3 : 0
                }}
                animate={{ opacity: isHovered ? 0.3 : 0 }}
                transition={{ duration: 0.5 }}
            />
        </motion.div>
    );
};

export default AnimatedSyncLogo;
