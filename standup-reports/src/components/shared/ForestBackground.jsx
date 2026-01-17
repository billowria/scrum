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

        // Velocity & Acceleration
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.ax = 0;
        this.ay = 0;

        // Properties
        this.size = Math.random() * 2.5 + 1.5;
        this.maxSpeed = 3.0;
        this.maxForce = 0.15;

        // Oscillation for "natural" feel
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = Math.random() * 0.05 - 0.025;
        this.hue = 35 + Math.random() * 15; // 35-50 range
    }

    applyForce(fx, fy) {
        this.ax += fx;
        this.ay += fy;
    }

    update(mouse, burst, width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;

        // 1. BEHAVIOR: Wander
        this.angle += (Math.random() - 0.5) * 0.2;
        const wanderX = Math.cos(this.angle) * 0.05;
        const wanderY = Math.sin(this.angle) * 0.05;
        this.applyForce(wanderX, wanderY);

        // 2. BEHAVIOR: Burst Repulsion (Startle Effect)
        // If burst is active, and we are near the burst source (previous mouse pos)
        if (burst && burst.active) {
            const bdx = this.x - burst.x;
            const bdy = this.y - burst.y;
            const distSq = bdx * bdx + bdy * bdy;

            // "Blast Radius": 200px
            if (distSq < 40000) {
                const dist = Math.sqrt(distSq);
                // Strong outward force
                // Stronger if closer
                const strength = (200 - dist) / 200; // 0 to 1
                const force = strength * 5.0; // Explosion strength

                // Direction away from burst center
                const dirX = bdx / dist;
                const dirY = bdy / dist;

                this.applyForce(dirX * force, dirY * force);
            }
        }

        // 3. BEHAVIOR: Seek Mouse (Gentle attraction)
        if (mouse.x > 0 && mouse.y > 0) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // "Arrive" behavior: Slow down when close
            if (dist < 400) {
                const speed = dist < 100
                    ? (dist / 100) * this.maxSpeed * 2.0
                    : this.maxSpeed * 2.5;

                const desiredX = (dx / dist) * speed;
                const desiredY = (dy / dist) * speed;

                const steerX = desiredX - this.vx;
                const steerY = desiredY - this.vy;

                this.applyForce(steerX * 0.2, steerY * 0.2);
            }
        }

        // Physics step
        this.vx += this.ax;
        this.vy += this.ay;

        // Speed Limit - Allow momentary burst speed but decay back
        // If speed is very high (burst), don't clamp immediately, let damping handle it
        const speedSq = this.vx * this.vx + this.vy * this.vy;

        // Soft speed limit
        if (speedSq > this.maxSpeed * this.maxSpeed) {
            // Drag/Friction to slow down after burst
            this.vx *= 0.95;
            this.vy *= 0.95;
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Reset accel
        this.ax = 0;
        this.ay = 0;

        // Wrap around screen
        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;
    }

    draw(ctx, time) {
        const pulse = Math.sin(time * 2 + this.x * 0.01) * 0.5 + 0.5;
        const alpha = 0.5 + pulse * 0.5;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalCompositeOperation = 'screen';

        const glowRad = this.size * (6 + pulse * 4);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRad);
        grad.addColorStop(0, `hsla(${this.hue}, 100%, 50%, ${alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * FOREST BACKGROUND
 * Pure Canvas Implementation with "Burst" Effect.
 */
const ForestBackground = () => {
    const canvasRef = useRef(null);
    const firefliesRef = useRef([]);
    const frameIdRef = useRef(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const lastMouseRef = useRef({ x: -1000, y: -1000 });
    const burstRef = useRef({ active: false, x: 0, y: 0, frame: 0 }); // Burst state
    const timeRef = useRef(0);
    const gatheringDurationRef = useRef(0);
    const lastTimestampRef = useRef(0);
    const seekCooldownRef = useRef(0);

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
            // Cap dt to prevent massive jumps after tab inactivity
            if (dt > 0.1) dt = 0.016;
            lastTimestampRef.current = timestamp;

            timeRef.current = timestamp / 1000;
            const t = timeRef.current;

            // Cooldown Logic: Decrement timer
            if (seekCooldownRef.current > 0) {
                seekCooldownRef.current -= dt;
            }

            // Gathering Logic: If mouse is active, accumulate time. After 5s, burst.
            if (mouseRef.current.x > 0) {
                gatheringDurationRef.current += dt;
                if (gatheringDurationRef.current > 5.0) {
                    burstRef.current = {
                        active: true,
                        x: mouseRef.current.x,
                        y: mouseRef.current.y,
                        frame: 0
                    };
                    gatheringDurationRef.current = 0;
                    seekCooldownRef.current = 2.0; // Disable seeking for 2s so they fly apart
                }
            } else {
                gatheringDurationRef.current = 0;
            }

            // Reset burst after a few frames
            if (burstRef.current.active) {
                burstRef.current.frame++;
                if (burstRef.current.frame > 5) {
                    burstRef.current.active = false;
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

            // Update & Draw
            // If cooldown is active, fireflies don't see the mouse
            const effectiveMouse = seekCooldownRef.current > 0 ? { x: -1000, y: -1000 } : mouseRef.current;

            firefliesRef.current.forEach(fly => {
                fly.update(effectiveMouse, burstRef.current, width, height);
                fly.draw(ctx, t);
            });

            frameIdRef.current = requestAnimationFrame(render);
        };

        const handleResize = () => init();

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const prev = lastMouseRef.current;

            // Calculate speed
            if (prev.x > 0) {
                const dx = x - prev.x;
                const dy = y - prev.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Burst Trigger: High speed movement (e.g. > 30px per event)
                if (dist > 30) {
                    burstRef.current = {
                        active: true,
                        x: prev.x, // Burst from WHERE we were
                        y: prev.y,
                        frame: 0
                    };
                    gatheringDurationRef.current = 0;
                }
            }

            lastMouseRef.current = { x, y };
            mouseRef.current = { x, y };
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
