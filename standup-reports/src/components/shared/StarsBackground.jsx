import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// --- Nebula Cloud Component ---
const NebulaCloud = ({ size, color, position, delay, blur = '100px' }) => (
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
        animate={{
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
const ShootingStar = ({ delay }) => (
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
);

// --- Starfield Canvas ---
const Starfield = () => {
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
                    twinkleSpeed: Math.random() * 0.02 + 0.01,
                    twinklePhase: Math.random() * Math.PI * 2,
                    // Star color variations (white, blue-white, yellow-white)
                    color: [
                        { r: 255, g: 255, b: 255 },
                        { r: 200, g: 220, b: 255 },
                        { r: 255, g: 245, b: 220 },
                        { r: 180, g: 200, b: 255 },
                    ][Math.floor(Math.random() * 4)]
                });
            }
        };

        const handleResize = () => initStars();
        window.addEventListener('resize', handleResize);
        initStars();

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        let time = 0;
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            time += 0.016;

            stars.forEach(star => {
                // Physics
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

                // Spring return
                star.vx += (star.ox - star.x) * RETURN_SPEED;
                star.vy += (star.oy - star.y) * RETURN_SPEED;

                // Friction
                star.vx *= DAMPING;
                star.vy *= DAMPING;

                // Update position
                star.x += star.vx;
                star.y += star.vy;

                // Twinkle effect
                const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase);
                const alpha = 0.3 + (star.brightness * 0.5) + (twinkle * 0.2);

                // Speed-based glow
                const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
                const activeGlow = dist < MOUSE_RADIUS;

                // Draw star
                ctx.beginPath();

                if (activeGlow || speed > 0.3) {
                    // Glowing star when active
                    const glowAlpha = Math.min(1, alpha + speed * 0.15);
                    const glowSize = star.size + Math.min(3, speed * 1.5);

                    // Outer glow
                    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize * 3);
                    gradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha})`);
                    gradient.addColorStop(0.4, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha * 0.3})`);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.arc(star.x, star.y, glowSize * 3, 0, Math.PI * 2);
                } else {
                    // Normal twinkling star
                    ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${alpha})`;
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                }
                ctx.fill();
            });

            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

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
                    rgba(100, 80, 140, 0.03) 20%,
                    rgba(120, 100, 160, 0.06) 35%,
                    rgba(140, 120, 180, 0.08) 50%,
                    rgba(120, 100, 160, 0.06) 65%,
                    rgba(100, 80, 140, 0.03) 80%,
                    transparent 100%
                )
            `,
        }}
    />
);

// --- Main Galaxy Background Component ---
const StarsBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-[#0a0a12] overflow-hidden pointer-events-none">
            {/* Deep space base gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse at 30% 20%, rgba(25, 25, 50, 0.8) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, rgba(20, 20, 45, 0.6) 0%, transparent 50%),
                        linear-gradient(to bottom, #0a0a12 0%, #0d0d1a 50%, #0a0a12 100%)
                    `
                }}
            />

            {/* Milky Way band effect */}
            <MilkyWayBand />

            {/* Interactive starfield */}
            <Starfield />

            {/* Nebula clouds - cosmic gas and dust */}
            <NebulaCloud
                size="600px"
                color="rgba(88, 28, 135, 0.15)"
                position={{ top: '-15%', left: '-10%' }}
                delay={0}
                blur="120px"
            />
            <NebulaCloud
                size="500px"
                color="rgba(30, 58, 138, 0.12)"
                position={{ bottom: '10%', left: '25%' }}
                delay={3}
                blur="100px"
            />
            <NebulaCloud
                size="450px"
                color="rgba(147, 51, 234, 0.1)"
                position={{ top: '20%', right: '-5%' }}
                delay={5}
                blur="90px"
            />
            <NebulaCloud
                size="350px"
                color="rgba(59, 130, 246, 0.08)"
                position={{ bottom: '30%', right: '20%' }}
                delay={2}
                blur="80px"
            />
            <NebulaCloud
                size="400px"
                color="rgba(236, 72, 153, 0.06)"
                position={{ top: '50%', left: '40%' }}
                delay={4}
                blur="100px"
            />

            {/* Shooting stars */}
            <ShootingStar delay={2} />
            <ShootingStar delay={8} />
            <ShootingStar delay={15} />
        </div>
    );
};

export default StarsBackground;

