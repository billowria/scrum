import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// --- Floating Orb Component ---
const FloatingOrb = ({ size, color, position, delay }) => (
    <motion.div
        className="floating-orb"
        style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            position: 'absolute',
            pointerEvents: 'none',
            ...position
        }}
        animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
            duration: 20 + delay * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay
        }}
    />
);

// --- Quantum Grid Effect ---
const QuantumGrid = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Configuration
        const SPACING = 40; // Space between dots
        const MOUSE_RADIUS = 200; // Interaction radius
        const REPEL_FORCE = 5; // How hard particles flee from mouse
        const RETURN_SPEED = 0.05; // Spring stiffness
        const DAMPING = 0.90; // Friction

        let points = [];
        let mouse = { x: -1000, y: -1000 };
        let rafId;

        // Initialize Grid
        const initGrid = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            points = [];

            const cols = Math.ceil(width / SPACING);
            const rows = Math.ceil(height / SPACING);

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * SPACING + SPACING / 2;
                    const y = j * SPACING + SPACING / 2;
                    points.push({
                        x: x, // Current position
                        y: y,
                        ox: x, // Origin position
                        oy: y,
                        vx: 0, // Velocity
                        vy: 0,
                        baseAlpha: Math.random() * 0.3 + 0.1, // Base opacity
                        size: 1.5
                    });
                }
            }
        };

        // Handle Resize
        const handleResize = () => {
            initGrid();
        };
        window.addEventListener('resize', handleResize);
        initGrid();

        // Handle Mouse
        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            points.forEach(p => {
                // Physics: Dist to mouse
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Mouse Repulsion
                if (dist < MOUSE_RADIUS) {
                    const force = (1 - dist / MOUSE_RADIUS) * REPEL_FORCE;
                    const angle = Math.atan2(dy, dx);
                    p.vx -= Math.cos(angle) * force;
                    p.vy -= Math.sin(angle) * force;
                }

                // Spring Return to Origin
                const ox = p.ox - p.x;
                const oy = p.oy - p.y;
                p.vx += ox * RETURN_SPEED;
                p.vy += oy * RETURN_SPEED;

                // Friction
                p.vx *= DAMPING;
                p.vy *= DAMPING;

                // Update Position
                p.x += p.vx;
                p.y += p.vy;

                // Visuals
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const active = dist < MOUSE_RADIUS;

                // Color blending based on activity/speed
                ctx.beginPath();

                if (active || speed > 0.5) {
                    const alpha = Math.min(1, p.baseAlpha + speed * 0.2);
                    ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`; // Cyan glow
                    ctx.arc(p.x, p.y, p.size + Math.min(2, speed), 0, Math.PI * 2);
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.baseAlpha})`;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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

    return <canvas ref={canvasRef} className="fixed inset-0 z-[0] pointer-events-none" />;
};

// --- Main Background Component ---
const QuantumBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 overflow-hidden pointer-events-none">
            <QuantumGrid />
            <FloatingOrb
                size="500px"
                color="rgba(99, 102, 241, 0.3)"
                position={{ top: '-10%', left: '-5%' }}
                delay={0}
            />
            <FloatingOrb
                size="400px"
                color="rgba(168, 85, 247, 0.25)"
                position={{ bottom: '5%', left: '30%' }}
                delay={2}
            />
            <FloatingOrb
                size="350px"
                color="rgba(236, 72, 153, 0.2)"
                position={{ top: '30%', left: '45%' }}
                delay={4}
            />
            <FloatingOrb
                size="400px"
                color="rgba(99, 102, 241, 0.25)"
                position={{ top: '-5%', right: '10%' }}
                delay={1}
            />
            <FloatingOrb
                size="300px"
                color="rgba(168, 85, 247, 0.3)"
                position={{ bottom: '20%', right: '-5%' }}
                delay={3}
            />
        </div>
    );
};

export default QuantumBackground;
