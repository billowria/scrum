import React, { useEffect, useRef } from 'react';

/**
 * DIWALI BACKGROUND - "The Scientist's Symphony"
 * 
 * Logic Update: "Cognitive Contrast & Golden Targeting"
 * 1. CYCLE: Randomized 8-12s intervals (Natural Rhythm).
 * 2. SILENCE OF AWE: 1.5s before the Giant burst, random spawns STOP. 
 *    This creates "Negative Space" ensuring the Giant burst hits a clean canvas.
 * 3. TARGETING: Gaussian distribution around (50% W, 25% H) for "Perfect Framing".
 */

// --- UTILS ---
const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max));

// Gaussian (Normal) Distribution for natural centering
const randomNormal = (mean, stdDev) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
};

const FIREWORK_PALETTES = [
    ['#FFD700', '#FFA500'],           // Pure Gold
    ['#FFD700', '#FFFFFF', '#C0C0C0'], // Silver & Gold
    ['#FF4500', '#FF8C00', '#FFD700'], // Deep Orange & Gold
    ['#DC143C', '#FFD700'],            // Crimson & Gold
    ['#B8860B', '#DAA520'],            // Antique Bronze
    ['#FFFFFF', '#87CEEB', '#00BFFF'], // Ice & Diamond (High Contrast)
];

const getRandomPalette = () => FIREWORK_PALETTES[randomInt(0, FIREWORK_PALETTES.length)];

const BURST_TYPES = {
    SMALL: { count: [10, 20], speed: [3, 5], decay: [0.03, 0.05], size: 1 },
    MEDIUM: { count: [30, 50], speed: [6, 9], decay: [0.02, 0.03], size: 1.2 },
    // Boosted BIG and VERY_BIG to be visually distinct
    BIG: { count: [80, 120], speed: [12, 18], decay: [0.015, 0.025], size: 1.8 },
    VERY_BIG: { count: [150, 220], speed: [16, 22], decay: [0.01, 0.015], size: 2.5 },
    // GIANT: Screen covering. Maximum scale.
    GIANT: { count: [300, 450], speed: [35, 55], decay: [0.004, 0.008], size: 3.5 }
};

// --- CLASSES ---

class Star {
    constructor(w, h) {
        this.x = random(0, w);
        this.y = random(0, h * 0.7);
        this.size = random(0.2, 0.8);
        this.baseAlpha = random(0.2, 0.8);
        this.twinkleOffset = random(0, Math.PI * 2);
    }

    draw(ctx, time) {
        const alpha = this.baseAlpha + Math.sin(time * 3 + this.twinkleOffset) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color, type = 'firework', burstSettings = null) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;

        this.color = color;
        this.type = type;

        if (type === 'firework') {
            const angle = random(0, Math.PI * 2);
            const speed = random(burstSettings.speed[0], burstSettings.speed[1]);
            const drag = random(0.85, 0.96);

            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            this.gravity = 0.05;
            this.friction = drag;
            this.alpha = 1;
            this.decay = random(burstSettings.decay[0], burstSettings.decay[1]);
            this.width = random(1.5, 3);
        } else {
            // Sparkle
            this.vx = random(-1.5, 1.5);
            this.vy = random(-1.5, 1.5);
            this.gravity = 0.04;
            this.friction = 0.92;
            this.alpha = 1;
            this.decay = random(0.04, 0.07);
            this.width = random(1, 2);
        }
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;

        this.alpha -= this.decay;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;

        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.strokeStyle = this.color;

        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

class Firework {
    constructor(w, h, targetX, targetY, forcedSize) {
        this.x = random(w * 0.1, w * 0.9);
        this.y = h;

        if (forcedSize === 'GIANT') {
            // Gaussian targeting for "Perfect Imperfection"
            // Mean: Center (w/2), StdDev: w/10. Keeps it central but organic.
            this.targetX = randomNormal(w / 2, w / 12);
            // Mean: High (h * 0.25), StdDev: h/20.
            this.targetY = randomNormal(h * 0.25, h * 0.05);

            // Clamp to screen bounds just in case Gaussian goes wild
            this.targetX = Math.max(w * 0.1, Math.min(w * 0.9, this.targetX));
            this.targetY = Math.max(h * 0.1, Math.min(h * 0.5, this.targetY));

            this.burstType = 'GIANT';
            this.speed = random(22, 28);
        } else {
            this.targetX = targetX || random(w * 0.2, w * 0.8);
            this.targetY = targetY || random(h * 0.1, h * 0.5);

            if (forcedSize) {
                this.burstType = forcedSize;
            } else {
                const rand = Math.random();
                // Adjusted probabilities: Less small, more Big/Very Big
                if (rand < 0.3) this.burstType = 'SMALL'; // 30%
                else if (rand < 0.6) this.burstType = 'MEDIUM'; // 30%
                else if (rand < 0.85) this.burstType = 'BIG'; // 25% (was < 0.95 ~20%)
                else this.burstType = 'VERY_BIG'; // 15% (was remaining ~5%)
            }
            this.speed = random(13, 17);
        }

        this.palette = getRandomPalette();
        this.particles = [];
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        this.exploded = false;
        this.trail = [];
    }

    update() {
        if (!this.exploded) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.02;

            this.trail.push({ x: this.x, y: this.y, alpha: 0.6 });
            if (this.trail.length > 8) this.trail.shift();
            this.trail.forEach(t => t.alpha -= 0.08);

            if (this.vy >= 0 || this.y < this.targetY) {
                this.explode();
            }
        } else {
            this.particles.forEach(p => p.update());
            this.particles = this.particles.filter(p => p.alpha > 0);
        }
    }

    explode() {
        this.exploded = true;
        const settings = BURST_TYPES[this.burstType];
        const particleCount = randomInt(settings.count[0], settings.count[1]);

        for (let i = 0; i < particleCount; i++) {
            const color = this.palette[randomInt(0, this.palette.length)];
            this.particles.push(new Particle(this.x, this.y, color, 'firework', settings));
        }
    }

    draw(ctx) {
        if (!this.exploded) {
            ctx.fillStyle = '#FFF';
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();

            if (this.trail.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 1.5;
                for (let i = 0; i < this.trail.length - 1; i++) {
                    const p1 = this.trail[i];
                    const p2 = this.trail[i + 1];
                    ctx.globalAlpha = Math.max(0, p1.alpha);
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                }
                ctx.stroke();
            }
        }

        if (this.particles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            this.particles.forEach(p => p.draw(ctx));
            ctx.restore();
        }
    }
}

const DiwaliBackground = ({ disableMouseInteraction = false, paused = false, hideParticles = false }) => {
    const canvasRef = useRef(null);
    const fireworksRef = useRef([]);
    const sparklesRef = useRef([]);
    const starsRef = useRef([]);
    const frameIdRef = useRef(0);
    const dimensionsRef = useRef({ w: 0, h: 0 });

    // Sequencer for Choreographed Patterns
    const sequencerRef = useRef({
        phase: 'GIANT',   // 'PATTERN' | 'PRE_GIANT_DELAY' | 'GIANT'
        step: 0,          // 0: Big Left, 1: Big Right, 2: Medium Center
        patternCount: 0,  // How many full patterns completed
        nextActionTime: 0 // When to trigger next event
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });

        const init = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            dimensionsRef.current = { w, h };
            starsRef.current = Array.from({ length: 80 }, () => new Star(w, h));

            // Start sequence after a brief initial pause
            sequencerRef.current.nextActionTime = 0.5;
        };

        const render = (timestamp) => {
            const t = timestamp / 1000;
            const { w, h } = dimensionsRef.current;
            const seq = sequencerRef.current;

            // --- SEQUENCER LOGIC ---
            if (seq.nextActionTime > 0 && t >= seq.nextActionTime) {
                if (seq.phase === 'PATTERN') {
                    // Define Geometric Patterns (Simultaneous Bursts)

                    // Pattern 1: "The Gate" (Two Big bursts at edges)
                    if (seq.step === 0) {
                        fireworksRef.current.push(new Firework(w, h, w * 0.2, h * 0.3, 'BIG'));
                        fireworksRef.current.push(new Firework(w, h, w * 0.8, h * 0.3, 'BIG'));

                        seq.step = 1;
                        seq.nextActionTime = t + random(2.5, 3.5); // Pause before next pattern
                    }
                    // Pattern 2: "The Trident" (Three Medium bursts across)
                    else if (seq.step === 1) {
                        fireworksRef.current.push(new Firework(w, h, w * 0.2, h * 0.4, 'MEDIUM'));
                        fireworksRef.current.push(new Firework(w, h, w * 0.5, h * 0.25, 'MEDIUM'));
                        fireworksRef.current.push(new Firework(w, h, w * 0.8, h * 0.4, 'MEDIUM'));

                        seq.step = 2;
                        seq.nextActionTime = t + random(2.5, 3.5);
                    }
                    // Pattern 3: "The Pyramid" (Base Bigs + High Center Very Big)
                    else if (seq.step === 2) {
                        fireworksRef.current.push(new Firework(w, h, w * 0.3, h * 0.5, 'BIG'));
                        fireworksRef.current.push(new Firework(w, h, w * 0.7, h * 0.5, 'BIG'));
                        fireworksRef.current.push(new Firework(w, h, w * 0.5, h * 0.2, 'VERY_BIG'));

                        // End of pattern cycle
                        seq.step = 0;
                        seq.patternCount++;

                        // Check for Grand Finale
                        if (seq.patternCount >= 2) { // After 2 full cycles (6 patterns)
                            seq.phase = 'PRE_GIANT_DELAY';
                            seq.nextActionTime = t + 2.5; // Dramatic pause
                        } else {
                            seq.nextActionTime = t + random(3.0, 4.0);
                        }
                    }
                }
                else if (seq.phase === 'PRE_GIANT_DELAY') {
                    seq.phase = 'GIANT';
                    seq.nextActionTime = t + 0.1;
                }
                else if (seq.phase === 'GIANT') {
                    // GRAND FINALE
                    fireworksRef.current.push(new Firework(w, h, null, null, 'GIANT'));

                    // Reset Sequence
                    seq.phase = 'PATTERN';
                    seq.step = 0;
                    seq.patternCount = 0;
                    seq.nextActionTime = t + random(6.0, 8.0); // Long recovery
                }
            }

            ctx.clearRect(0, 0, w, h);
            starsRef.current.forEach(star => star.draw(ctx, t));

            // Fireworks rendering (skip if hideParticles)
            if (!hideParticles) {
                fireworksRef.current.forEach(fw => fw.update());
                fireworksRef.current.forEach(fw => fw.draw(ctx));
                fireworksRef.current = fireworksRef.current.filter(fw => !fw.exploded || fw.particles.length > 0);

                if (sparklesRef.current.length > 0) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    sparklesRef.current.forEach(sp => sp.update());
                    sparklesRef.current.forEach(sp => sp.draw(ctx));
                    ctx.restore();
                    sparklesRef.current = sparklesRef.current.filter(sp => sp.alpha > 0);
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
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (Math.random() < 0.4) {
                sparklesRef.current.push(new Particle(x, y, '#FFD700', 'sparkle'));
            }
        };

        const handleClick = (e) => {
            if (disableMouseInteraction) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            fireworksRef.current.push(new Firework(dimensionsRef.current.w, dimensionsRef.current.h, x, y, 'VERY_BIG'));
            for (let i = 0; i < 15; i++) {
                sparklesRef.current.push(new Particle(x, y, '#FFFFFF', 'sparkle'));
            }
        };

        window.addEventListener('resize', handleResize);
        if (!disableMouseInteraction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousedown', handleClick);
        }

        init();
        frameIdRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener('resize', handleResize);
            if (!disableMouseInteraction) {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mousedown', handleClick);
            }
        };
    }, [disableMouseInteraction, paused, hideParticles]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#0F0518]">
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(circle at 60% 100%, #3B0D54 0%, #1A0529 50%, #0F0518 100%)
                    `
                }}
            />
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#FFD70008] to-transparent pointer-events-none z-10" />
            <canvas ref={canvasRef} className="absolute inset-0 block" />
        </div>
    );
};

export default DiwaliBackground;
