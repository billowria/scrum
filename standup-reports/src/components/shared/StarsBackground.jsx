import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Nebula Cloud Component ---
const NebulaCloud = ({ size, color, position, delay, blur = '100px', paused = false }) => (
    <motion.div
        className="nebula-cloud"
        style={{
            width: size,
            height: size,
            background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
            position: 'absolute',
            pointerEvents: 'none',
            filter: `blur(${blur})`,
            mixBlendMode: 'screen',
            ...position
        }}
        animate={paused ? {} : {
            x: [0, 20, -15, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.15, 0.95, 1],
            rotate: [0, 5, -5, 0],
        }}
        transition={{
            duration: 30 + delay * 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay
        }}
    />
);

// --- Shooting Star Component ---
const ShootingStar = ({ delay, paused = false }) => (
    <AnimatePresence>
        {!paused && (
            <motion.div
                className="absolute w-px h-px bg-white rounded-full"
                style={{
                    top: `${Math.random() * 40}%`,
                    left: `${Math.random() * 100}%`,
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                    x: [0, 150],
                    y: [0, 100],
                    opacity: [0, 1, 1, 0],
                }}
                transition={{
                    duration: 1.5,
                    delay: delay,
                    repeat: Infinity,
                    repeatDelay: 8 + Math.random() * 15,
                    ease: "easeOut"
                }}
            >
                {/* Trail */}
                <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-px"
                    style={{
                        background: 'linear-gradient(to left, rgba(255,255,255,0.8), transparent)',
                    }}
                />
            </motion.div>
        )}
    </AnimatePresence>
);

// --- Starfield Canvas ---
const Starfield = ({ disableMouseInteraction = false, paused = false }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Star configuration
        const STAR_COUNT = 300;
        const MOUSE_RADIUS = 180;
        const REPEL_FORCE = 4;
        const RETURN_SPEED = 0.03;
        const DAMPING = 0.92;

        let stars = [];
        let mouse = { x: -1000, y: -1000 };
        let rafId;

        // Initialize Stars
        const initStars = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            stars = [];

            for (let i = 0; i < STAR_COUNT; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                stars.push({
                    x, y,
                    ox: x, oy: y,
                    vx: 0, vy: 0,
                    size: Math.random() * 2 + 0.5,
                    brightness: Math.random(),
                    twinkleSpeed: Math.random() * 0.005 + 0.002, // Slower for smoother transition
                    twinklePhase: Math.random() * Math.PI * 2,
                    glowScale: Math.random() * 0.5 + 0.5,
                    // Star color variations (white, blue-white, yellow-white)
                    color: [
                        { r: 255, g: 255, b: 255 },
                        { r: 210, g: 230, b: 255 },
                        { r: 255, g: 250, b: 230 },
                        { r: 190, g: 210, b: 255 },
                    ][Math.floor(Math.random() * 4)]
                });
            }
        };

        const handleResize = () => initStars();
        window.addEventListener('resize', handleResize);
        initStars();

        const handleMouseMove = (e) => {
            if (disableMouseInteraction) return;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        if (!disableMouseInteraction) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        let time = 0;
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            time += 0.016;

            stars.forEach(star => {
                // Physics - only apply mouse interaction if enabled
                if (!disableMouseInteraction) {
                    const dx = mouse.x - star.x;
                    const dy = mouse.y - star.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Mouse interaction - stars flee from cursor
                    if (dist < MOUSE_RADIUS) {
                        const force = (1 - dist / MOUSE_RADIUS) * REPEL_FORCE;
                        const angle = Math.atan2(dy, dx);
                        star.vx -= Math.cos(angle) * force;
                        star.vy -= Math.sin(angle) * force;
                    }
                }

                // Spring return
                star.vx += (star.ox - star.x) * RETURN_SPEED;
                star.vy += (star.oy - star.y) * RETURN_SPEED;

                // Friction
                star.vx *= DAMPING;
                star.vy *= DAMPING;

                // Update position
                star.x += star.vx;
                star.y += star.vy;

                // Automatic Smooth Glow / Twinkle
                const twinkle = Math.sin(time * 2 + star.twinklePhase);
                const glowAlpha = 0.2 + (star.brightness * 0.4) + (twinkle * 0.3);
                const automaticGlowSize = star.size * (1 + Math.abs(twinkle) * star.glowScale);

                // Speed-based glow
                const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
                const dx = mouse.x - star.x;
                const dy = mouse.y - star.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const activeGlow = !disableMouseInteraction && dist < MOUSE_RADIUS;

                // Draw star
                ctx.beginPath();

                if (activeGlow || speed > 0.3) {
                    // Interaction Glow
                    const interactionAlpha = Math.min(1, glowAlpha + speed * 0.2);
                    const glowSize = automaticGlowSize + Math.min(4, speed * 2);

                    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize * 2);
                    gradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${interactionAlpha})`);
                    gradient.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${interactionAlpha * 0.2})`);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.arc(star.x, star.y, glowSize * 2, 0, Math.PI * 2);
                } else {
                    // Constant Smooth Glow
                    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, automaticGlowSize * 2);
                    gradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha})`);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.arc(star.x, star.y, automaticGlowSize * 2, 0, Math.PI * 2);

                    // Core
                    ctx.fill();
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha + 0.2})`;
                    ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
                }
                ctx.fill();
            });

            // Only continue animating if not paused
            if (!paused) {
                rafId = requestAnimationFrame(animate);
            }
        };

        if (!paused) {
            rafId = requestAnimationFrame(animate);
        } else {
            // Draw once when paused so background is visible
            animate();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (!disableMouseInteraction) {
                window.removeEventListener('mousemove', handleMouseMove);
            }
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [disableMouseInteraction, paused]);

    return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" />;
};

// --- Milky Way Band ---
const MilkyWayBand = () => (
    <div
        className="absolute inset-0 pointer-events-none z-[0]"
        style={{
            background: `
                linear-gradient(
                    135deg,
                    transparent 0%,
                    rgba(100, 80, 140, 0.02) 20%,
                    rgba(120, 100, 160, 0.04) 35%,
                    rgba(140, 120, 180, 0.05) 50%,
                    rgba(120, 100, 160, 0.04) 65%,
                    rgba(100, 80, 140, 0.02) 80%,
                    transparent 100%
                )
            `,
        }}
    />
);

// --- Main Galaxy Background Component ---
const StarsBackground = ({ disableMouseInteraction = false, paused = false, hideParticles = false }) => {
    return (
        <div className="fixed inset-0 z-0 bg-[#020205] overflow-hidden pointer-events-none">
            {/* Deep space base gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse at 30% 20%, rgba(15, 15, 30, 0.5) 0%, transparent 40%),
                        radial-gradient(ellipse at 70% 80%, rgba(10, 10, 25, 0.4) 0%, transparent 40%),
                        linear-gradient(to bottom, #010103 0%, #030308 50%, #010103 100%)
                    `
                }}
            />

            {/* Milky Way band effect */}
            <MilkyWayBand />

            {/* Interactive starfield - hidden when hideParticles is true */}
            {!hideParticles && <Starfield disableMouseInteraction={disableMouseInteraction} paused={paused} />}

            {/* Nebula clouds - cosmic gas and dust */}
            <NebulaCloud
                size="700px"
                color="rgba(88, 28, 135, 0.08)"
                position={{ top: '-15%', left: '-10%' }}
                delay={0}
                blur="140px"
                paused={paused}
            />
            <NebulaCloud
                size="600px"
                color="rgba(30, 58, 138, 0.06)"
                position={{ bottom: '10%', left: '25%' }}
                delay={3}
                blur="120px"
                paused={paused}
            />
            <NebulaCloud
                size="500px"
                color="rgba(147, 51, 234, 0.05)"
                position={{ top: '20%', right: '-5%' }}
                delay={5}
                blur="110px"
                paused={paused}
            />
            <NebulaCloud
                size="400px"
                color="rgba(59, 130, 246, 0.04)"
                position={{ bottom: '30%', right: '20%' }}
                delay={2}
                blur="100px"
                paused={paused}
            />
            <NebulaCloud
                size="450px"
                color="rgba(236, 72, 153, 0.03)"
                position={{ top: '50%', left: '40%' }}
                delay={4}
                blur="120px"
                paused={paused}
            />

            {/* Shooting stars */}
            {!hideParticles && (
                <>
                    <ShootingStar delay={2} paused={paused} />
                    <ShootingStar delay={8} paused={paused} />
                    <ShootingStar delay={15} paused={paused} />
                </>
            )}
        </div>
    );
};

export default StarsBackground;

