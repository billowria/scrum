import React, { useEffect, useRef } from 'react';

/**
 * OCEAN BACKGROUND - "Bioluminescent Flow"
 * Pure Canvas Implementation.
 * 
 * Concept:
 * 1. Deep Abyssal Blue Gradient.
 * 2. "Currents": Large animated sine waves representing water flow.
 * 3. "Life": Particles (plankton) that flow along the sine waves but can be disturbed.
 * 4. "Interaction": Ripples that push particles away.
 */

class Particle {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;

        // Base velocity (The "Flow")
        this.baseSpeed = Math.random() * 0.5 + 0.2;

        // Disturbance velocity (From interaction)
        this.vx = 0;
        this.vy = 0;

        this.size = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.3;

        // Unique offset for wave calculation
        this.waveOffset = Math.random() * Math.PI * 2;
    }

    update(time, interactionItems) {
        // 1. Natural Flow (Left to Right, with sine wave bobbing)
        // x moves steady
        // y moves based on sine of x + time

        const waveY = Math.sin(this.x * 0.003 + time + this.waveOffset) * 0.5;

        this.x += this.baseSpeed;
        this.y += waveY;

        // 2. Interaction (Optional - currently disabled for small bubble trail)
        // You can re-enable particle interaction with bubbles if desired
        /*
        interactionItems.forEach(item => {
            // Logic for interaction if needed
        });
        */

        // Apply disturbance velocity
        this.x += this.vx;
        this.y += this.vy;

        // Damping (Friction) triggers restoration to flow
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Wrap around
        if (this.x > this.w + 10) this.x = -10;
        if (this.x < -10) this.x = this.w + 10;
        if (this.y > this.h + 10) this.y = -10;
        if (this.y < -10) this.y = this.h + 10;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(6, 182, 212, ${this.alpha})`; // Cyan-500
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Bubble {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 10; // Tighter offset
        this.y = y + (Math.random() - 0.5) * 10;
        this.size = Math.random() * 4 + 4; // Larger bubbles: 4-8px
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015; // Faster decay for trail effect
        this.vx = (Math.random() - 0.5) * 0.8; // Slight horizontal drift
        this.vy = -(Math.random() * 1.5 + 0.5); // Rise upward
        this.wobble = Math.random() * Math.PI * 2; // Phase for wobble
        this.wobbleSpeed = Math.random() * 0.1 + 0.05;
    }

    update() {
        // Wobble horizontally as it rises
        this.wobble += this.wobbleSpeed;
        this.x += this.vx + Math.sin(this.wobble) * 0.3;
        this.y += this.vy;

        // Slow down as it rises
        this.vy *= 0.995;

        // Shrink slightly
        this.size *= 0.995;

        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0 || this.size < 0.5) return;

        const alpha = this.life * 0.6;

        // Outer glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha * 0.2})`;
        ctx.fill();

        // Inner bubble
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 243, 252, ${alpha * 0.8})`;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.fill();
    }
}

const OceanBackground = ({ disableMouseInteraction = false, paused = false, hideParticles = false }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const bubblesRef = useRef([]); // Changed from ripplesRef
    const frameIdRef = useRef(0);
    const timeRef = useRef(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const lastMouseRef = useRef({ x: -1000, y: -1000 }); // Track previous position
    const lastSpawnTime = useRef(0); // For rate limiting bubble spawn

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let width, height;

        const init = () => {
            width = window.innerWidth;
            height = window.innerHeight;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `100%`; // Ensure it fills container
            canvas.style.height = `100%`;

            // Spawn Particles
            const count = Math.floor((width * height) / 8000);
            particlesRef.current = Array.from({ length: count }, () => new Particle(width, height));
        };

        const drawBackgroundWaves = (ctx, t) => {
            // Draw faint, massive flowing sine waves in the background
            ctx.save();
            ctx.strokeStyle = 'rgba(30, 58, 138, 0.3)'; // Blue-900 transparent
            ctx.lineWidth = 2;

            const lines = 5;
            for (let i = 0; i < lines; i++) {
                ctx.beginPath();
                // Vertical offset
                const yBase = (height / lines) * i + (height / lines) / 2;

                ctx.moveTo(0, yBase);
                for (let x = 0; x <= width; x += 20) {
                    // Sine wave logic
                    const y = yBase + Math.sin(x * 0.005 + t * 0.5 + i) * 30;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.restore();
        };

        const render = (timestamp) => {
            timeRef.current = timestamp / 1000;
            const t = timeRef.current;

            ctx.clearRect(0, 0, width, height);

            // 1. Draw Background Flow Lines
            drawBackgroundWaves(ctx, t);

            // 2. Update & Draw Bubbles (was Ripples)
            bubblesRef.current = bubblesRef.current.filter(b => b.life > 0);
            bubblesRef.current.forEach(b => {
                b.update();
                b.draw(ctx);
            });

            // 3. Update & Draw Particles (skip if hideParticles)
            if (!hideParticles) {
                particlesRef.current.forEach(p => {
                    p.update(t, bubblesRef.current);
                    p.draw(ctx);
                });
            }

            // 4. Mouse Trail / Bubble spawning logic (only if enabled)
            if (!disableMouseInteraction) {
                const mx = mouseRef.current.x;
                const my = mouseRef.current.y;
                const lmx = lastMouseRef.current.x;
                const lmy = lastMouseRef.current.y;

                if (mx > 0) {
                    const dist = Math.hypot(mx - lmx, my - lmy);

                    // Only spawn if mouse has moved significantly (> 5px)
                    if (dist > 5) {
                        // Rate limit: max 1 bubble every 20ms
                        if (timestamp - lastSpawnTime.current > 20) {
                            bubblesRef.current.push(new Bubble(mx, my));
                            lastSpawnTime.current = timestamp;
                            lastMouseRef.current = { x: mx, y: my }; // Update last position only on spawn/movement check
                        }
                    }
                    // Always update tracking if we have valid coordinates
                    if (dist > 0) {
                        lastMouseRef.current = { x: mx, y: my };
                    }
                }
            }

            // Only continue animating if not paused
            if (!paused) {
                frameIdRef.current = requestAnimationFrame(render);
            }
        };

        const handleResize = () => init();
        const handleMouseMove = (e) => {
            if (disableMouseInteraction) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
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
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020617]">
            {/* 
                Base Background Gradient
                Slate 950 (#020617) -> Deep Blue 900 (#1e3a8a)
            */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #020617 70%)'
                }}
            />

            <canvas ref={canvasRef} className="absolute inset-0 block" />
        </div>
    );
};

export default OceanBackground;
