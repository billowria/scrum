// src/layouts/PublicLayout.jsx
// Shared layout for Landing and Auth pages with persistent background
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiLayers } from 'react-icons/fi';

// --- Shared Visual Components (moved from LandingPage) ---
const FloatingOrb = ({ size, color, position, delay }) => (
    <motion.div
        className="absolute rounded-full pointer-events-none blur-[100px] opacity-40"
        style={{ width: size, height: size, background: color, ...position }}
        animate={{ x: [0, 50, -30, 0], y: [0, -50, 30, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay }}
    />
);

const QuantumGrid = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height, points = [], mouse = { x: -1000, y: -1000 };
        const SPACING = 60, MOUSE_RADIUS = 250, REPEL_FORCE = 4, RETURN_SPEED = 0.03, DAMPING = 0.92;

        const initGrid = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            points = [];
            for (let i = 0; i < Math.ceil(width / SPACING); i++) {
                for (let j = 0; j < Math.ceil(height / SPACING); j++) {
                    const x = i * SPACING + SPACING / 2, y = j * SPACING + SPACING / 2;
                    points.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, baseAlpha: Math.random() * 0.2 + 0.05, size: 1.5 });
                }
            }
        };

        const handleResize = () => initGrid();
        const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        initGrid();

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            points.forEach(p => {
                const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS) {
                    const force = (1 - dist / MOUSE_RADIUS) * REPEL_FORCE, angle = Math.atan2(dy, dx);
                    p.vx -= Math.cos(angle) * force;
                    p.vy -= Math.sin(angle) * force;
                }
                p.vx += (p.ox - p.x) * RETURN_SPEED;
                p.vy += (p.oy - p.y) * RETURN_SPEED;
                p.vx *= DAMPING;
                p.vy *= DAMPING;
                p.x += p.vx;
                p.y += p.vy;
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                ctx.beginPath();
                if (dist < MOUSE_RADIUS || speed > 0.5) {
                    ctx.fillStyle = `rgba(100, 200, 255, ${Math.min(1, p.baseAlpha + speed * 0.15)})`;
                    ctx.arc(p.x, p.y, p.size + Math.min(2, speed), 0, Math.PI * 2);
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.baseAlpha})`;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                }
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };

        const raf = requestAnimationFrame(animate);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(raf);
        };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" />;
};

// --- Shared Navbar for Public Pages ---
const PublicNavbar = ({ scrolled }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthPage = ['/login', '/signup', '/forgot', '/reset-password'].includes(location.pathname);

    return (
        <motion.nav
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0b14]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}
            initial={false}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo with layoutId for morph animation */}
                <motion.div layoutId="main-logo" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                    <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FiLayers className="text-white w-4 h-4" />
                        </div>
                        <span className="text-white">SYNC</span>
                    </Link>
                </motion.div>

                {/* Nav Items - only show on landing */}
                {!isAuthPage && (
                    <motion.div
                        className="hidden md:flex gap-8 items-center text-sm font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <a href="#features" className="text-slate-400 hover:text-white transition-colors">Product</a>
                        <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors">Company</a>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <button onClick={() => navigate('/login')} className="text-white hover:text-indigo-400 transition-colors">Sign In</button>
                        <motion.button
                            onClick={() => navigate('/signup')}
                            className="px-5 py-2 rounded-full bg-white text-black hover:scale-105 transition-transform font-bold"
                            layoutId="cta-button"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            Get Started
                        </motion.button>
                    </motion.div>
                )}

                {/* Back to Home - only on auth pages */}
                {isAuthPage && (
                    <motion.button
                        onClick={() => navigate('/')}
                        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        ← Back to Home
                    </motion.button>
                )}
            </div>
        </motion.nav>
    );
};

// --- Page Transition Variants ---
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        filter: "blur(8px)"
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1]
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        filter: "blur(8px)",
        transition: {
            duration: 0.3,
            ease: "easeIn"
        }
    }
};

// --- Main Layout Component ---
export default function PublicLayout({ children }) {
    const [scrolled, setScrolled] = React.useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0b14] text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Persistent Background - Never re-renders */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <QuantumGrid />
                <FloatingOrb size="500px" color="rgba(99, 102, 241, 0.3)" position={{ top: '-10%', left: '-5%' }} delay={0} />
                <FloatingOrb size="400px" color="rgba(168, 85, 247, 0.25)" position={{ bottom: '5%', left: '30%' }} delay={2} />
                <FloatingOrb size="350px" color="rgba(236, 72, 153, 0.2)" position={{ top: '30%', left: '45%' }} delay={4} />
                <FloatingOrb size="400px" color="rgba(99, 102, 241, 0.25)" position={{ top: '-5%', right: '10%' }} delay={1} />
                <FloatingOrb size="300px" color="rgba(168, 85, 247, 0.3)" position={{ bottom: '20%', right: '-5%' }} delay={3} />
            </div>

            {/* Shared Navbar */}
            <PublicNavbar scrolled={scrolled} />

            {/* Animated Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative z-10"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Export individual components for reuse
export { QuantumGrid, FloatingOrb, pageVariants };
