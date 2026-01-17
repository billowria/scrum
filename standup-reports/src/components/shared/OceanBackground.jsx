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

    update(time, ripples) {
        // 1. Natural Flow (Left to Right, with sine wave bobbing)
        // x moves steady
        // y moves based on sine of x + time

        const waveY = Math.sin(this.x * 0.003 + time + this.waveOffset) * 0.5;

        this.x += this.baseSpeed;
        this.y += waveY;

        // 2. Interaction (Ripples)
        ripples.forEach(ripple => {
            const dx = this.x - ripple.x;
            const dy = this.y - ripple.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // If particle intersects with the ripple ring thickness
            // Ripple expands from 0 to maxRadius
            // We verify if particle is near the current "wavefront" radius
            const distFromWavefront = Math.abs(dist - ripple.radius);

            if (dist < ripple.radius && distFromWavefront < 30) {
                // Approximate "Push" force
                const force = (30 - distFromWavefront) / 30; // 0 to 1 strength

                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * 0.5;
                this.vy += Math.sin(angle) * force * 0.5;
            }
        });

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

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 200;
        this.life = 1.0; // Opacity
        this.speed = 3;
    }

    update() {
        this.radius += this.speed;
        this.life -= 0.015; // Decay
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(165, 243, 252, ${this.life * 0.3})`; // Cyan-200
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

const OceanBackground = () => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const ripplesRef = useRef([]);
    const frameIdRef = useRef(0);
    const timeRef = useRef(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const lastMouseRef = useRef({ x: -1000, y: -1000 });

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
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

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

            // 2. Update & Draw Ripples
            // Filter out dead ripples
            ripplesRef.current = ripplesRef.current.filter(r => r.life > 0);
            ripplesRef.current.forEach(r => {
                r.update();
                r.draw(ctx);
            });

            // 3. Update & Draw Particles
            particlesRef.current.forEach(p => {
                p.update(t, ripplesRef.current);
                p.draw(ctx);
            });

            // 4. Mouse Trail / Ripple spawning logic
            // Only spawn ripple on movement
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const lmx = lastMouseRef.current.x;
            const lmy = lastMouseRef.current.y;

            if (mx > 0 && lmx > 0) {
                const dist = Math.hypot(mx - lmx, my - lmy);
                // If moved enough, spawn ripple
                if (dist > 30) {
                    ripplesRef.current.push(new Ripple(mx, my));
                    lastMouseRef.current = { x: mx, y: my };
                }
            } else if (mx > 0) {
                lastMouseRef.current = { x: mx, y: my };
            }

            frameIdRef.current = requestAnimationFrame(render);
        };

        const handleResize = () => init();
        const handleMouseMove = (e) => {
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
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        init();
        frameIdRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
        };
    }, []);

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
