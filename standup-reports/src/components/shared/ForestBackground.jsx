import React, { useEffect, useRef } from 'react';

/**
 * FIREFLY CLASS
 * Implements physics with steering behaviors: Wander, Mouse Seek, and Burst Repulsion.
 */
class Firefly {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Position
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;

        // Velocity - Ultra slow, fluid drift
        this.vx = (Math.random() - 0.5) * 0.15;
        this.vy = (Math.random() - 0.5) * 0.15;

        // Properties
        this.size = Math.random() * 2 + 1.5; // 1.5-3.5px (Slightly larger core)

        // Blink Cycle
        this.blinkPhase = Math.random() * Math.PI * 2;
        this.blinkSpeed = Math.random() * 0.015 + 0.005; // Very slow, breathing cycle

        this.hue = 42 + Math.random() * 8; // 42-50 (Golden Amber)
    }

    update(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;

        // Fluid Wander (Perlin-noise like smoothness via low random acceleration)
        this.vx += (Math.random() - 0.5) * 0.005; // Very low accel
        this.vy += (Math.random() - 0.5) * 0.005;

        // Soft speed limit
        const maxSpeed = 0.2; // Slower cap
        if (Math.abs(this.vx) > maxSpeed) this.vx *= 0.98;
        if (Math.abs(this.vy) > maxSpeed) this.vy *= 0.98;

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Update Blink Phase
        this.blinkPhase += this.blinkSpeed;

        // Wrap around screen with buffer
        const buffer = 100;
        if (this.x < -buffer) this.x = width + buffer;
        if (this.x > width + buffer) this.x = -buffer;
        if (this.y < -buffer) this.y = height + buffer;
        if (this.y > height + buffer) this.y = -buffer;
    }

    draw(ctx) {
        // Calculate Blink Opacity
        // Use Sin^2 for a smoother "always positive" pulse that feels like breathing
        const sine = Math.sin(this.blinkPhase);
        const normalized = (sine + 1) / 2;

        // Smooth breathing curve: (x^2) creates a nice ease-in/ease-out
        // Base alpha of 0.15 so it never fully disappears
        const alpha = Math.pow(normalized, 2) * 0.85 + 0.15;

        if (alpha < 0.05) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalCompositeOperation = 'screen';

        // 1. Atmosphere Bloom (Large, soft halo)
        // Dynamic size based on brightness
        const glowSize = this.size * (6 + alpha * 8);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 50%, ${alpha * 0.5})`); // More opacity in center
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // 2. The Bulb Core (Solid, bright center)
        // High lightness (85-95%) for "hot" filament look
        ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 3. Lens Flare / Sparkle (Optional subtle detail)
        if (alpha > 0.8) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(alpha - 0.8) * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class TrailParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 15;
        this.y = y + (Math.random() - 0.5) * 15;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1; // 1-3px
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
        this.hue = 35 + Math.random() * 20; // Golden/Greenish
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const alpha = this.life;

        // Glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 60%, ${alpha * 0.8})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Cores
        ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * FOREST BACKGROUND
 * Pure Canvas Implementation with "Burst" Effect.
 */
const ForestBackground = ({ disableMouseInteraction = false, paused = false, hideParticles = false }) => {
    const canvasRef = useRef(null);
    const firefliesRef = useRef([]);
    const trailRef = useRef([]); // New trail particles
    const frameIdRef = useRef(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const lastMouseRef = useRef({ x: -1000, y: -1000 });
    const lastSpawnTime = useRef(0);
    const lastTimestampRef = useRef(0);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });

        let width, height;

        const init = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const count = Math.floor((width * height) / 15000) + 15; // Add 10-20 extra fireflies
            firefliesRef.current = Array.from({ length: Math.min(count, 70) }, () => new Firefly(width, height));
        };

        const render = (timestamp) => {
            if (lastTimestampRef.current === 0) lastTimestampRef.current = timestamp;
            let dt = (timestamp - lastTimestampRef.current) / 1000;
            if (dt > 0.1) dt = 0.016;
            lastTimestampRef.current = timestamp;

            timeRef.current = timestamp / 1000;
            const t = timeRef.current;

            // Spawn Trails if mouse moving
            if (!disableMouseInteraction && mouseRef.current.x > 0) {
                const mx = mouseRef.current.x;
                const my = mouseRef.current.y;
                const lmx = lastMouseRef.current.x;
                const lmy = lastMouseRef.current.y;

                if (lmx > 0) {
                    const dist = Math.hypot(mx - lmx, my - lmy);
                    if (dist > 5) {
                        // Rate limit spawn
                        if (timestamp - lastSpawnTime.current > 20) {
                            trailRef.current.push(new TrailParticle(mx, my));
                            lastSpawnTime.current = timestamp;
                            lastMouseRef.current = { x: mx, y: my };
                        }
                    } else {
                        // Keep evaluating position even if slow
                        lastMouseRef.current = { x: mx, y: my };
                    }
                } else {
                    lastMouseRef.current = { x: mx, y: my };
                }
            }

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Draw Fog
            ctx.save();
            ctx.filter = 'blur(60px)';
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(6, 95, 70, 0.2)';
            ctx.beginPath();
            ctx.arc(width * 0.2 + Math.sin(t * 0.1) * 50, height * 0.8, 300, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(2, 44, 34, 0.4)';
            ctx.beginPath();
            ctx.arc(width * 0.8 - Math.cos(t * 0.15) * 50, height * 0.2, 400, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Update & Draw fireflies (skip if hideParticles)
            if (!hideParticles) {
                firefliesRef.current.forEach(fly => {
                    fly.update(width, height);
                    fly.draw(ctx, t);
                });
            }

            // Update & Draw Trail
            trailRef.current = trailRef.current.filter(p => p.life > 0);
            trailRef.current.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            // Only continue animating if not paused
            if (!paused) {
                frameIdRef.current = requestAnimationFrame(render);
            }
        };

        const handleResize = () => init();

        const handleMouseMove = (e) => {
            if (disableMouseInteraction) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Just update ref, spawning happens in render
            mouseRef.current = { x, y };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
            lastMouseRef.current = { x: -1000, y: -1000 };
        };

        window.addEventListener('resize', handleResize);
        if (!disableMouseInteraction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseout', handleMouseLeave);
        }

        init();
        frameIdRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener('resize', handleResize);
            if (!disableMouseInteraction) {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseout', handleMouseLeave);
            }
        };
    }, [disableMouseInteraction, paused, hideParticles]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#022c22]">
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 50% 100%, #064e3b 0%, #022c22 60%, #000000 100%)'
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            <canvas ref={canvasRef} className="absolute inset-0 block" />
        </div>
    );
};

export default ForestBackground;
