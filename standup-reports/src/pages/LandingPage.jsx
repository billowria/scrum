// src/pages/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// QuantumBackground handled by PublicLayout
import AnimatedSyncLogo from '../components/shared/AnimatedSyncLogo';
import Lenis from '@studio-freight/lenis';
import {
    FiArrowRight, FiCheck, FiMessageCircle, FiCheckSquare, FiCalendar, FiEdit3,
    FiSend, FiStar, FiMenu, FiX, FiGithub, FiTwitter, FiLinkedin, FiLayers, FiClock,
    FiUsers, FiPieChart, FiZap, FiShield
} from 'react-icons/fi';

// --- Configuration (Shared with AuthPage) ---
const APP_MODULES = [
    { id: 'chat', title: 'Start Sync', icon: FiMessageCircle, color: '#ec4899', desc: "Team Communication", gradient: "from-pink-500 to-rose-500" },
    { id: 'tasks', title: 'Track Work', icon: FiCheckSquare, color: '#f59e0b', desc: "Kanban Boards", gradient: "from-amber-400 to-orange-500" },
    { id: 'notes', title: 'Share Knowledge', icon: FiEdit3, color: '#10b981', desc: "Wiki & Docs", gradient: "from-emerald-400 to-teal-500" },
    { id: 'leave', title: 'Manage Time', icon: FiCalendar, color: '#3b82f6', desc: "Leave Calendar", gradient: "from-blue-400 to-cyan-500" },
    { id: 'projects', title: 'Ship Faster', icon: FiLayers, color: '#8b5cf6', desc: "Project Views", gradient: "from-violet-500 to-purple-600" },
];

// --- Feature Showcase Configuration ---
const FEATURE_SHOWCASE = [
    {
        id: 'standups',
        tag: 'Daily Sync',
        title: 'Reports that don\'t suck.',
        desc: 'Replace boring 9 AM meetings with playful async updates. Your team stays aligned while you ship code, not attend calls.',
        Icon: FiCheckSquare,
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
        bgGradient: 'from-emerald-500/20 via-transparent to-transparent',
        features: ['Async updates', 'Smart reminders', 'Team visibility', 'Beautiful reports'],
        mockType: 'standups'
    },
    {
        id: 'teams',
        tag: 'Team Hub',
        title: 'One org. Infinite teams.',
        desc: 'Create unlimited teams, each with their own projects, chats, and analytics. Cross-team visibility without cross-team chaos.',
        Icon: FiUsers,
        gradient: 'from-blue-400 via-indigo-500 to-purple-500',
        bgGradient: 'from-blue-500/20 via-transparent to-transparent',
        features: ['Unlimited teams', 'Team analytics', 'Hierarchy views', 'Role permissions'],
        mockType: 'teams'
    },
    {
        id: 'chatnotes',
        tag: 'Collaborate',
        title: 'Share everything. Instantly.',
        desc: 'Team chat and personal notes with beautiful UI. Share tasks, reports, and documents with a click. Knowledge flows freely.',
        Icon: FiMessageCircle,
        gradient: 'from-pink-400 via-rose-500 to-orange-500',
        bgGradient: 'from-pink-500/20 via-transparent to-transparent',
        features: ['Team chat', 'Personal notes', 'Share anything', 'Rich formatting'],
        mockType: 'chatnotes'
    },
    {
        id: 'dashboard',
        tag: 'Command Center',
        title: 'Everything. One glance.',
        desc: 'A dashboard that actually dashboards. Quick actions, live stats, and your team\'s pulse — all in one beautiful view.',
        Icon: FiZap,
        gradient: 'from-cyan-400 via-teal-500 to-emerald-500',
        bgGradient: 'from-cyan-500/20 via-transparent to-transparent',
        features: ['Quick actions', 'Live metrics', 'Team activity', 'Smart shortcuts'],
        mockType: 'dashboard'
    },
    {
        id: 'admincontrol',
        tag: 'Admin Power',
        title: 'Total control. Zero friction.',
        desc: 'Manage users, teams, and projects from one powerful control center. Permissions, invites, and oversight made simple.',
        Icon: FiShield,
        gradient: 'from-slate-400 via-zinc-500 to-neutral-600',
        bgGradient: 'from-slate-500/20 via-transparent to-transparent',
        features: ['User management', 'Team controls', 'Project settings', 'Permission matrix'],
        mockType: 'admincontrol'
    },
    {
        id: 'calendar',
        tag: 'Team Visibility',
        title: 'Calendar that tells the truth.',
        desc: 'Leave requests, holidays, and availability in one shared view. Plan sprints knowing exactly who\'s around.',
        Icon: FiCalendar,
        gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
        bgGradient: 'from-cyan-500/20 via-transparent to-transparent',
        features: ['Shared calendar', 'Leave approvals', 'Holiday sync', 'Capacity view'],
        mockType: 'calendar'
    },
    {
        id: 'projects',
        tag: 'Project Command',
        title: 'Drag. Drop. Done.',
        desc: 'Beautiful Kanban boards, sprint planning, and project documentation that actually gets read. Track everything, miss nothing.',
        Icon: FiLayers,
        gradient: 'from-amber-400 via-orange-500 to-red-500',
        bgGradient: 'from-amber-500/20 via-transparent to-transparent',
        features: ['Kanban boards', 'Sprint cycles', 'Project docs', 'Progress tracking'],
        mockType: 'kanban'
    },
    {
        id: 'analytics',
        tag: 'Insights',
        title: 'Data, delightfully visualized.',
        desc: 'Real-time dashboards that make you look smart in meetings. Velocity, burndown, and team health — all at a glance.',
        Icon: FiPieChart,
        gradient: 'from-pink-400 via-rose-500 to-red-500',
        bgGradient: 'from-pink-500/20 via-transparent to-transparent',
        features: ['Live dashboards', 'Velocity charts', 'Team health', 'Exportable reports'],
        mockType: 'stats'
    }
];

// --- Testimonials Data ---
const TESTIMONIALS = [
    {
        id: 1,
        name: 'Sarah Chen',
        role: 'Engineering Lead',
        company: 'Vercel',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        quote: 'SquadSync transformed how our distributed team stays aligned. The async standups alone saved us 10+ hours of meetings per week.',
        rating: 5,
        gradient: 'from-pink-500 to-rose-500'
    },
    {
        id: 2,
        name: 'Marcus Rivera',
        role: 'Product Manager',
        company: 'Stripe',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        quote: 'Finally, a tool that understands remote work. The dashboard gives me instant visibility into what everyone is working on.',
        rating: 5,
        gradient: 'from-blue-500 to-indigo-500'
    },
    {
        id: 3,
        name: 'Emily Nakamura',
        role: 'CTO',
        company: 'Linear',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        quote: 'We evaluated 12 different tools. SquadSync was the only one that felt like it was designed by people who actually work in tech.',
        rating: 5,
        gradient: 'from-violet-500 to-purple-500'
    },
    {
        id: 4,
        name: 'David Park',
        role: 'Head of Engineering',
        company: 'Notion',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        quote: 'The Kanban boards and sprint planning are beautifully integrated. It is like Jira, but actually enjoyable to use.',
        rating: 5,
        gradient: 'from-emerald-500 to-teal-500'
    },
    {
        id: 5,
        name: 'Aisha Patel',
        role: 'VP of Product',
        company: 'Figma',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        quote: 'Our team happiness scores went up 40% after switching to SquadSync. Less meetings, more shipping.',
        rating: 5,
        gradient: 'from-amber-500 to-orange-500'
    },
    {
        id: 6,
        name: 'James Wilson',
        role: 'Founder',
        company: 'Arc Browser',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        quote: 'The attention to design and UX is incredible. Every interaction feels intentional and polished.',
        rating: 5,
        gradient: 'from-cyan-500 to-blue-500'
    }
];

// --- Testimonial Card Component ---
const TestimonialCard = ({ testimonial, index }) => {
    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        });
    };

    const handleMouseLeave = () => {
        setMousePosition({ x: 0.5, y: 0.5 });
    };

    const rotateX = (mousePosition.y - 0.5) * -10;
    const rotateY = (mousePosition.x - 0.5) * 10;

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative flex-shrink-0 w-[340px] md:w-[400px] p-6 rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 group cursor-pointer"
            style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d'
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
        >
            {/* Gradient Glow */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            {/* Quote Icon */}
            <div className="absolute top-4 right-4 text-6xl font-serif text-white/5 select-none">"</div>

            {/* Quote Text */}
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 relative z-10">
                "{testimonial.quote}"
            </p>

            {/* Star Rating */}
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                    >
                        <FiStar className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    </motion.div>
                ))}
            </div>

            {/* Author */}
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                    />
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${testimonial.gradient} opacity-30 blur-md -z-10`} />
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">{testimonial.name}</h4>
                    <p className="text-slate-400 text-xs">{testimonial.role} @ {testimonial.company}</p>
                </div>
            </div>
        </motion.div>
    );
};

// --- Animated Logo Component (now using shared component) ---
const AnimatedLogo = () => <AnimatedSyncLogo size="md" showText={true} />;

// --- Text Scramble Effect ---
const ScrambleText = ({ text, className, isInView }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = '!<>-_\\/[]{}—=+*^?#________';

    useEffect(() => {
        if (!isInView) {
            setDisplayText(text.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join(''));
            return;
        }

        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(prev =>
                text.split('').map((char, i) => {
                    if (i < iteration) return text[i];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('')
            );
            iteration += 1 / 3;
            if (iteration >= text.length) clearInterval(interval);
        }, 30);

        return () => clearInterval(interval);
    }, [isInView, text]);

    return <span className={className}>{displayText}</span>;
};

// --- Shared Visual Components ---




// --- Cinematic Reveal Component ---
const MaskedReveal = ({ children, delay = 0, className = "" }) => (
    <div className={`overflow-hidden relative inline-block align-bottom ${className}`}>
        <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1], // Custom cinematic bezier
                delay
            }}
        >
            {children}
        </motion.div>
    </div>
);

// --- Hero Mock Components (Exact copies from AuthPage for consistency) ---
const HeroChat = () => (
    <div className="flex flex-col h-full p-4 gap-3">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1"><div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center"><FiMessageCircle className="text-pink-400 text-sm" /></div><div className="text-xs font-medium text-white/90">#general</div></div>
        {[1, 2, 3].map((i) => (<motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className={`flex gap-2 ${i === 2 ? 'flex-row-reverse' : ''}`}><div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" /><div className={`p-2 rounded-lg text-[10px] max-w-[80%] ${i === 2 ? 'bg-pink-500/20 text-pink-100' : 'bg-white/5 text-slate-300'}`}><div className="h-2 w-24 bg-current opacity-20 rounded mb-1" /><div className="h-2 w-16 bg-current opacity-10 rounded" /></div></motion.div>))}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.4 }} className="mt-auto h-8 rounded-full bg-white/5 border border-white/10 flex items-center px-3"><div className="h-2 w-20 bg-white/10 rounded animate-pulse" /><FiSend className="ml-auto text-white/20 text-xs" /></motion.div>
    </div>
);
const HeroTasks = () => (
    <div className="flex h-full p-3 gap-2 overflow-hidden">
        {['To Do', 'In Progress'].map((col, i) => (<div key={col} className="flex-1 flex flex-col gap-2 rounded-lg bg-white/5 p-2"><div className="text-[10px] font-bold text-slate-400 mb-1 flex justify-between">{col} <span className="bg-white/10 px-1 rounded">{i + 2}</span></div>{[1, 2].map((card) => (<motion.div key={card} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.2) + (card * 0.1) }} className="p-2 rounded bg-white/5 border border-white/5 hover:border-amber-500/50 transition-colors cursor-pointer"><div className="h-2 w-full bg-white/20 rounded mb-2" /><div className="flex justify-between items-center"><div className="h-1.5 w-6 bg-amber-500/40 rounded" /><div className="w-4 h-4 rounded-full bg-white/10" /></div></motion.div>))}</div>))}
    </div>
);
const HeroNotes = () => (
    <div className="h-full p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-400/80 mb-2"><FiEdit3 /><div className="h-2 w-32 bg-current opacity-40 rounded" /></div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2"><div className="h-2 w-full bg-white/10 rounded" /><div className="h-2 w-full bg-white/10 rounded" /><div className="h-2 w-3/4 bg-white/10 rounded" /></motion.div>
        <div className="grid grid-cols-2 gap-2 mt-2">{[1, 2, 3, 4].map((i) => (<motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }} className="aspect-square rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2"><div className="w-6 h-6 rounded bg-emerald-500/20 mb-2" /><div className="h-1.5 w-8 bg-white/20 rounded" /></motion.div>))}</div>
    </div>
);
const HeroLeave = () => (
    <div className="h-full p-4">
        <div className="flex justify-between items-center mb-4 text-blue-400"><div className="text-xs font-bold">September 2025</div><div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><div className="w-1.5 h-1.5 rounded-full bg-white/20" /></div></div>
        <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: 28 }).map((_, i) => (<motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className={`aspect-square rounded-sm flex items-center justify-center text-[8px] ${[4, 12, 18, 25].includes(i) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-110 font-bold' : [5, 13, 19, 26].includes(i) ? 'bg-blue-500/20 text-blue-200' : 'bg-white/5 text-white/30'}`}>{i + 1}</motion.div>))}</div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><FiClock className="text-blue-400" /></div><div><div className="h-1.5 w-20 bg-white/30 rounded mb-1" /><div className="h-1.5 w-12 bg-white/10 rounded" /></div></motion.div>
    </div>
);
const HeroProjects = () => (
    <div className="h-full p-4 flex flex-col gap-3">
        <div className="flex gap-2 mb-2"><div className="h-6 w-20 bg-violet-500/20 rounded border border-violet-500/30" /><div className="h-6 w-16 bg-white/5 rounded border border-white/5" /></div>
        <div className="space-y-2">{[1, 2, 3].map((i) => (<motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.15 }} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10"><div className="w-8 h-8 rounded bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-white/5"><FiLayers className="text-violet-300 text-xs" /></div><div className="flex-1"><div className="h-2 w-24 bg-white/20 rounded mb-1.5" /><div className="w-full bg-white/10 h-1 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${60 + Math.random() * 30}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 1 }} className="h-full bg-violet-500" /></div></div></motion.div>))}</div>
    </div>
);

// --- Mock UIs for Feature Sections ---
const MockChat = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center"><FiMessageCircle className="text-pink-400" /></div>
            <div><div className="font-bold">#product-design</div><div className="text-xs text-slate-400">12 members active</div></div>
        </div>
        {[1, 2, 3].map((i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.2 }} className={`flex gap-3 mb-4 ${i === 2 ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${i === 2 ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/5 text-slate-300 rounded-bl-none'}`}>
                    <div className="h-2 w-32 bg-current opacity-20 rounded mb-2" /> <div className="h-2 w-20 bg-current opacity-10 rounded" />
                </div>
            </motion.div>
        ))}
    </div>
);

const MockKanban = () => (
    <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-4">
        {['In Progress', 'Done'].map((col, i) => (
            <div key={col} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">{col} <span className="bg-white/10 px-1.5 rounded">{i + 2}</span></div>
                {[1, 2].map((card) => (
                    <motion.div key={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.2 + card * 0.1 }} className="p-3 rounded-xl bg-white/5 border border-white/5 mb-3 hover:bg-white/10 transition-colors">
                        <div className="flex gap-2 mb-2"><div className={`w-8 h-1 rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} /></div>
                        <div className="h-2 w-full bg-white/20 rounded mb-2" /><div className="h-2 w-2/3 bg-white/10 rounded" />
                    </motion.div>
                ))}
            </div>
        ))}
    </div>
);

const MockStats = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-end mb-8">
            <div><div className="text-sm text-slate-400 mb-1">Team Velocity</div><div className="text-3xl font-bold text-white">124 <span className="text-sm text-emerald-400 font-normal">+12%</span></div></div>
            <div className="flex gap-1 items-end h-16">
                {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.1, duration: 0.5 }} className="w-3 bg-indigo-500/50 rounded-t-sm" />
                ))}
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Sprint Completion</span><span className="text-white font-bold">92%</span></div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '92%' }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" /></div>
        </div>
    </div>
);

// --- Section Component ---
const MockCalendar = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="flex justify-between items-center mb-6">
            <div className="font-bold text-lg">October 2026</div>
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer"><FiArrowRight className="rotate-180" /></div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer"><FiArrowRight /></div>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2 mb-6">
            {Array.from({ length: 31 }).map((_, i) => {
                const isLeave = [4, 18, 19].includes(i);
                const isHoliday = [12].includes(i);
                const isToday = i === 14;
                return (
                    <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.01 }}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs relative cursor-pointer hover:bg-white/10 transition-colors
                        ${isToday ? 'bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25' :
                                isLeave ? 'bg-blue-500/20 text-blue-300' :
                                    isHoliday ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'}`}>
                        {i + 1}
                        {isLeave && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
                        {isHoliday && <div className="absolute bottom-1 w-1 h-1 bg-rose-400 rounded-full" />}
                    </motion.div>
                );
            })}
        </div>
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.5 }} className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><FiClock className="text-blue-400" /></div>
                <div>
                    <div className="text-sm font-bold">Time Tracker</div>
                    <div className="text-xs text-slate-400">38h 12m logged this week</div>
                </div>
                <div className="ml-auto text-emerald-400 font-bold text-sm">Active</div>
            </div>
        </motion.div>
    </div>
);

const MockNotes = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex gap-4 h-[320px]">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-white/5 pr-4 flex flex-col gap-3">
            <div className="h-4 w-20 bg-emerald-500/20 rounded mb-2" />
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-2 w-full bg-white/5 rounded" />
            ))}
            <div className="mt-auto h-20 w-full bg-gradient-to-t from-emerald-500/10 to-transparent rounded-lg" />
        </div>
        {/* Editor */}
        <div className="flex-1">
            <div className="h-8 w-3/4 bg-white/10 rounded mb-6" />
            <div className="space-y-3">
                <div className="h-2 w-full bg-white/5 rounded" />
                <div className="h-2 w-full bg-white/5 rounded" />
                <div className="h-2 w-2/3 bg-white/5 rounded" />
            </div>
            <div className="mt-6 flex gap-3">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.3 }} className="w-24 h-16 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"><FiEdit3 className="text-emerald-400 text-xl" /></motion.div>
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.4 }} className="flex-1 h-16 rounded-lg bg-white/5 border border-white/5" />
            </div>
        </div>
    </div>
);

const MockAdmin = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
            <div className="font-bold">Team Members</div>
            <div className="px-3 py-1.5 rounded-full bg-violet-600/20 text-violet-300 text-xs font-bold border border-violet-600/30 flex items-center gap-2 cursor-pointer hover:bg-violet-600/30 transition-colors">
                <FiCheckSquare className="w-3 h-3" /> Invite
            </div>
        </div>
        <div className="space-y-3">
            {[
                { name: 'Alex Rivera', role: 'Admin', status: 'Online', color: 'bg-green-500' },
                { name: 'Sarah Chen', role: 'Dev', status: 'In Meeting', color: 'bg-amber-500' },
                { name: 'Mike Ross', role: 'Design', status: 'Offline', color: 'bg-slate-500' },
                { name: 'Emma Watson', role: 'Product', status: 'Online', color: 'bg-green-500' }
            ].map((user, i) => (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10 text-xs font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-white">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.color}`} />
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

// --- NEW: MockStandups - Playful daily standup visual ---
const MockStandups = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <FiCheckSquare className="text-emerald-400" />
                </div>
                <div>
                    <div className="font-bold text-white">Daily Standup</div>
                    <div className="text-xs text-slate-400">Today, 9:00 AM</div>
                </div>
            </div>
            <motion.div
                className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                ✓ 4/5 submitted
            </motion.div>
        </div>
        <div className="space-y-3">
            {[
                { name: 'Alex', task: 'Shipped login flow', emoji: '🚀' },
                { name: 'Sarah', task: 'API integration', emoji: '⚡' },
                { name: 'Mike', task: 'Waiting on design', emoji: '🎨' },
            ].map((update, i) => (
                <motion.div
                    key={i}
                    className="p-3 rounded-xl bg-white/5 border border-white/5"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                            {update.name[0]}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white">{update.name}</div>
                            <div className="text-xs text-slate-400">{update.task}</div>
                        </div>
                        <span className="text-lg">{update.emoji}</span>
                    </div>
                </motion.div>
            ))}
        </div>
        <motion.div
            className="mt-4 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-medium cursor-pointer hover:bg-emerald-500/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            + Add your update
        </motion.div>
    </div>
);

// --- NEW: MockTeams - Animated org chart visual ---
const MockTeams = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
            <div className="font-bold text-white">Your Organization</div>
            <div className="text-xs text-slate-400">4 teams • 28 members</div>
        </div>
        <div className="relative flex items-center justify-center mb-6 h-24">
            <motion.div
                className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <FiUsers className="text-white text-xl" />
            </motion.div>
            {['T1', 'T2', 'T3', 'T4'].map((t, i) => (
                <motion.div
                    key={i}
                    className="absolute w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white"
                    animate={{
                        x: [Math.cos(i * Math.PI / 2) * 50, Math.cos((i * Math.PI / 2) + Math.PI) * 50],
                        y: [Math.sin(i * Math.PI / 2) * 35, Math.sin((i * Math.PI / 2) + Math.PI) * 35],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                >
                    {t}
                </motion.div>
            ))}
        </div>
        <div className="space-y-2">
            {[
                { name: 'Engineering', members: 12, color: 'from-blue-400 to-cyan-500' },
                { name: 'Design', members: 6, color: 'from-pink-400 to-rose-500' },
                { name: 'Product', members: 5, color: 'from-amber-400 to-orange-500' },
                { name: 'Marketing', members: 5, color: 'from-emerald-400 to-teal-500' },
            ].map((team, i) => (
                <motion.div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${team.color} flex items-center justify-center`}>
                        <FiUsers className="text-white text-sm" />
                    </div>
                    <div className="flex-1 text-sm text-white">{team.name}</div>
                    <div className="text-xs text-slate-400">{team.members} members</div>
                </motion.div>
            ))}
        </div>
    </div>
);

// --- NEW: MockChatNotes - Chat and notes sharing visual ---
const MockChatNotes = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex gap-4 mb-4">
            {/* Chat side */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <FiMessageCircle className="text-pink-400" />
                    <span className="text-sm font-bold text-white">Team Chat</span>
                </div>
                <div className="space-y-2">
                    {['Shared the design doc 📎', 'Check the new API ⚡', 'LGTM! 🚀'].map((msg, i) => (
                        <motion.div
                            key={i}
                            className="p-2 rounded-lg bg-white/5 text-xs text-slate-300"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                        >
                            {msg}
                        </motion.div>
                    ))}
                </div>
            </div>
            {/* Notes side */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <FiEdit3 className="text-emerald-400" />
                    <span className="text-sm font-bold text-white">Notes</span>
                </div>
                <div className="space-y-2">
                    {['Sprint Retro', 'Meeting Notes', 'Ideas 💡'].map((note, i) => (
                        <motion.div
                            key={i}
                            className="p-2 rounded-lg bg-white/5 text-xs text-slate-300 border-l-2 border-emerald-500/50"
                            initial={{ opacity: 0, x: 10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                        >
                            {note}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
        <motion.div
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/20"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.5 }}
        >
            <FiSend className="text-pink-400" />
            <span className="text-sm text-white">Share with team</span>
        </motion.div>
    </div>
);

// --- NEW: MockDashboard - Command center with quick actions ---
const MockDashboard = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-white">Dashboard</div>
            <motion.div
                className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                ● Live
            </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
            {[
                { label: 'Tasks', value: '24', color: 'from-blue-400 to-cyan-500' },
                { label: 'Done', value: '18', color: 'from-emerald-400 to-teal-500' },
                { label: 'Team', value: '8', color: 'from-purple-400 to-pink-500' },
            ].map((stat, i) => (
                <motion.div
                    key={i}
                    className="p-3 rounded-xl bg-white/5 text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                >
                    <div className={`text-2xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                </motion.div>
            ))}
        </div>

        {/* Quick Actions */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
            {[
                { icon: <FiCheckSquare />, label: 'New Task', color: 'text-amber-400' },
                { icon: <FiMessageCircle />, label: 'Chat', color: 'text-pink-400' },
                { icon: <FiCalendar />, label: 'Schedule', color: 'text-blue-400' },
                { icon: <FiEdit3 />, label: 'Note', color: 'text-emerald-400' },
            ].map((action, i) => (
                <motion.div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <span className={action.color}>{action.icon}</span>
                    <span className="text-xs text-white">{action.label}</span>
                </motion.div>
            ))}
        </div>
    </div>
);

// --- NEW: MockAdminCenter - Admin control panel visual ---
const MockAdminCenter = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
                <FiShield className="text-white" />
            </div>
            <div>
                <div className="font-bold text-white">Admin Control</div>
                <div className="text-xs text-slate-400">Full system access</div>
            </div>
        </div>

        {/* Control sections */}
        <div className="space-y-3">
            {[
                { label: 'Users', count: 28, icon: <FiUsers />, color: 'from-blue-400 to-cyan-500' },
                { label: 'Teams', count: 4, icon: <FiLayers />, color: 'from-violet-400 to-purple-500' },
                { label: 'Projects', count: 12, icon: <FiCheckSquare />, color: 'from-amber-400 to-orange-500' },
            ].map((section, i) => (
                <motion.div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center text-white text-sm`}>
                        {section.icon}
                    </div>
                    <div className="flex-1 text-sm text-white">{section.label}</div>
                    <div className="px-2 py-1 rounded-full bg-white/10 text-xs text-slate-300">{section.count}</div>
                    <FiArrowRight className="text-slate-500" />
                </motion.div>
            ))}
        </div>

        <motion.div
            className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.6 }}
        >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400">All systems operational</span>
        </motion.div>
    </div>
);

// --- Full Viewport Feature Component ---
const FullViewportFeature = ({ feature, index }) => {
    const containerRef = useRef(null);

    // Delay mount detection to prevent premature animation firing
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        // Small delay ensures IntersectionObserver doesn't fire on initial render
        const timer = setTimeout(() => setHasMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Explicit useInView hook with replay enabled (once: false)
    // Only becomes active AFTER hasMounted is true
    const isInView = useInView(containerRef, {
        once: false, // Allow replay on both scroll directions
        amount: 0.35, // Trigger when 35% visible
    });

    // Combined state: only animate when both mounted AND in view
    const shouldAnimate = hasMounted && isInView;

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 0.5, 1], [80, 0, -80]);
    const bgOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 0.6, 0]);

    const Icon = feature.Icon;

    // Mock component mapping
    const MockComponents = {
        standups: MockStandups,
        teams: MockTeams,
        chatnotes: MockChatNotes,
        dashboard: MockDashboard,
        admincontrol: MockAdminCenter,
        calendar: MockCalendar,
        kanban: MockKanban,
        stats: MockStats,
        chat: MockChat,
        notes: MockNotes,
        admin: MockAdmin
    };
    const MockComponent = MockComponents[feature.mockType];

    return (
        <motion.div
            ref={containerRef}
            id={`feature-${feature.id}`}
            className="h-screen w-full relative flex items-center justify-center px-6 overflow-hidden snap-start"
            style={{ height: '100vh', minHeight: '100vh' }}
        >
            {/* Background gradient */}
            <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient}`}
                style={{ opacity: bgOpacity }}
            />

            {/* Morphing blob background */}
            <motion.div
                className={`absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-3xl`}
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, -50, 0],
                    y: [0, -30, 30, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${feature.gradient}`}
                        style={{
                            left: `${8 + i * 8}%`,
                            top: `${15 + (i % 4) * 20}%`,
                        }}
                        animate={{
                            y: [0, -40, 0],
                            x: [0, 15, -15, 0],
                            opacity: [0.1, 0.7, 0.1],
                            scale: [0.3, 1.2, 0.3]
                        }}
                        transition={{
                            duration: 3 + i * 0.4,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <motion.div
                className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                style={{ y }}
            >
                {/* Text content */}
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    {/* Feature badge */}
                    <motion.div
                        className="inline-flex items-center gap-3 mb-6"
                        initial={{ opacity: 0, x: -30 }}
                        animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <motion.div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-2xl`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon className="text-white text-2xl" />
                        </motion.div>
                        <span className={`text-sm font-bold uppercase tracking-widest bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                            {feature.tag}
                        </span>
                    </motion.div>

                    {/* Title with glitch effect on reveal */}
                    <motion.h2
                        className="text-5xl md:text-7xl font-black leading-tight mb-6"
                        initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                        animate={shouldAnimate ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 50, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {feature.title}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        className="text-xl text-slate-400 leading-relaxed mb-8 max-w-lg"
                        initial={{ opacity: 0, y: 30 }}
                        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {feature.desc}
                    </motion.p>

                    {/* Feature list with stagger */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {feature.features.map((f, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-3 text-sm text-slate-300 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors"
                                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                animate={shouldAnimate ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -20, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                                whileHover={{ x: 5 }}
                            >
                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                                    <FiCheck className="text-white text-xs" />
                                </div>
                                {f}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Visual */}
                <motion.div
                    className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}
                    initial={{ opacity: 0, scale: 0.8, rotateY: index % 2 === 0 ? 20 : -20 }}
                    animate={shouldAnimate ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: index % 2 === 0 ? 20 : -20 }}
                    transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
                    style={{ perspective: 1000 }}
                >
                    {/* Glow effect */}
                    <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-30 blur-3xl rounded-3xl`}
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Card container */}
                    <motion.div
                        className="relative transform-gpu"
                        whileHover={{ scale: 1.05, rotateY: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <MockComponent />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Progress indicator - Right side navigation */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 z-50">
                {FEATURE_SHOWCASE.map((f, i) => (
                    <motion.button
                        key={i}
                        className={`group relative w-3 h-8 rounded-full cursor-pointer transition-all duration-300 ${i === index ? `bg-gradient-to-b ${feature.gradient} shadow-lg shadow-current/50` : 'bg-white/10 hover:bg-white/30'}`}
                        onClick={() => {
                            const targetFeature = document.getElementById(`feature-${f.id}`);
                            if (targetFeature) targetFeature.scrollIntoView({ behavior: 'smooth' });
                        }}
                        whileHover={{ scale: 1.3, x: -5 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* Tooltip on hover */}
                        <motion.div
                            className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-2 rounded-lg bg-black/90 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200"
                            initial={{ x: 10 }}
                            whileHover={{ x: 0 }}
                        >
                            <div className="text-xs font-bold text-white">{f.title}</div>
                            <div className="text-[10px] text-slate-400">{f.tag}</div>
                            {/* Arrow */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-black/90 border-r border-t border-white/10 rotate-45" />
                        </motion.div>
                        {/* Active indicator pulse */}
                        {i === index && (
                            <motion.div
                                className={`absolute inset-0 rounded-full bg-gradient-to-b ${f.gradient}`}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Scroll for more indicator - Dynamic texts per section */}
            {index < FEATURE_SHOWCASE.length - 1 && (
                <motion.button
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer group"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.8 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    onClick={() => {
                        const nextFeature = document.getElementById(`feature-${FEATURE_SHOWCASE[index + 1].id}`);
                        if (nextFeature) nextFeature.scrollIntoView({ behavior: 'smooth' });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Dynamic scroll text based on next feature */}
                    <motion.span
                        className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium group-hover:text-white transition-colors"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {[
                            '↓ Explore Teams',
                            '↓ See Collaboration',
                            '↓ View Dashboard',
                            '↓ Admin Power',
                            '↓ Calendar Magic',
                            '↓ Project Flow',
                            '↓ Analytics Awaits'
                        ][index] || '↓ Next Feature'}
                    </motion.span>

                    {/* Slim elegant scroll indicator */}
                    <div className="relative flex flex-col items-center">
                        {/* Glowing line */}
                        <motion.div
                            className={`w-px h-12 bg-gradient-to-b ${feature.gradient} rounded-full`}
                            animate={{ opacity: [0.3, 1, 0.3], scaleY: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        {/* Animated dot traveling down */}
                        <motion.div
                            className={`absolute top-0 w-2 h-2 rounded-full bg-gradient-to-br ${feature.gradient} shadow-lg`}
                            animate={{ y: [0, 44, 0], opacity: [1, 0.5, 1], scale: [1, 0.6, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Bottom chevron */}
                        <motion.div
                            className="mt-1"
                            animate={{ y: [0, 3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <FiArrowRight className={`rotate-90 w-4 h-4 text-transparent bg-gradient-to-br ${feature.gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
                        </motion.div>
                    </div>
                </motion.button>
            )}

            {/* Back/Up scroll indicator - Shows on all except first section */}
            {index > 0 && (
                <motion.button
                    className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-3 cursor-pointer group"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.8 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    onClick={() => {
                        const prevFeature = document.getElementById(`feature-${FEATURE_SHOWCASE[index - 1].id}`);
                        if (prevFeature) prevFeature.scrollIntoView({ behavior: 'smooth' });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Dynamic back text */}
                    <motion.span
                        className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium group-hover:text-white transition-colors"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {[
                            '↑ Back to Top',
                            '↑ Daily Standups',
                            '↑ Team Hub',
                            '↑ Collaboration',
                            '↑ Dashboard',
                            '↑ Admin Control',
                            '↑ Calendar',
                            '↑ Projects'
                        ][index] || '↑ Previous'}
                    </motion.span>


                </motion.button>
            )}
        </motion.div>
    );
};

// --- Feature Separator Component ---
const FeatureSeparator = () => (
    <div className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
            {/* Animated gradient line */}
            <div className="relative h-px w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                    animate={{
                        x: ['-100%', '100%'],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>
        </div>
    </div>
);

// --- Section Component ---
const Section = ({ align = 'left', title, desc, tag, children }) => (
    <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <div className={`${align === 'right' ? 'md:order-2' : ''} relative`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />
                {children}
            </div>
            {/* Text */}
            <motion.div initial={{ opacity: 0, x: align === 'left' ? 50 : -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <div className="inline-flex px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-indigo-400 mb-6 uppercase tracking-widest">{tag}</div>
                <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{title}</h2>
                <p className="text-xl text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
        </div>
    </section>
);

export default function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const lastScrollY = useRef(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    // AuthPage Logic for Hero Animation
    // AuthPage Logic for Hero Animation
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setHidden(true);
            } else {
                setHidden(false);
            }
            setScrolled(currentScrollY > 50);
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll);
        // Auto-cycle tabs for hero
        const timer = setInterval(() => {
            setActiveTab(prev => {
                const idx = APP_MODULES.findIndex(m => m.id === prev);
                return APP_MODULES[(idx + 1) % APP_MODULES.length].id;
            });
        }, 3000);

        // Initialize Lenis for smooth scrolling
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
            lenis.destroy();
        };
    }, []);

    const activeModule = APP_MODULES.find(m => m.id === activeTab);

    return (
        <div className="min-h-screen bg-transparent text-white selection:bg-indigo-500/30 overflow-x-hidden scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
            {/* Ambient Background (Exact Match to AuthPage) */}
            {/* Ambient Background handled by PublicLayout */}

            {/* Navbar */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 transform ${hidden ? '-translate-y-full' : 'translate-y-0'} ${scrolled ? 'bg-[#0a0b14]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <AnimatedLogo />
                    <div className="hidden md:flex gap-8 items-center text-sm font-medium">
                        <a href="#features" className="text-slate-400 hover:text-white transition-colors">Product</a>
                        <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors">Company</a>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <button onClick={() => navigate('/login')} className="text-white hover:text-indigo-400 transition-colors">Sign In</button>
                        <button onClick={() => navigate('/signup')} className="px-5 py-2 rounded-full bg-white text-black hover:scale-105 transition-transform font-bold">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className="relative z-10 pt-48 pb-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="flex flex-col justify-center">
                        {/* Architectural Label */}
                        <MaskedReveal delay={1.2} className="mb-6">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-[1px] bg-indigo-500"></span>
                                <span className="font-mono text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
                                    Architect Your Organization
                                </span>
                            </div>
                        </MaskedReveal>

                        {/* Main Headline */}
                        <div className="mb-8 leading-none">
                            <div className="block overflow-hidden relative">
                                <MaskedReveal delay={1.3}>
                                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mb-2">
                                        One Workspace.
                                    </h1>
                                </MaskedReveal>
                            </div>
                            <div className="block overflow-hidden relative">
                                <MaskedReveal delay={1.4}>
                                    <div className="flex items-baseline gap-1">
                                        <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-400">
                                            Infinite Teams.
                                        </h1>
                                        {/* Blinking Cursor */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2 }}
                                            className="w-4 h-12 bg-indigo-500 ml-1 translate-y-2"
                                        />
                                    </div>
                                </MaskedReveal>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-10 block">
                            <MaskedReveal delay={1.6}>
                                <p className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed border-l-2 border-white/10 pl-6">
                                    The complete operating system for company-wide alignment.
                                    From executive strategy to sprint execution,
                                    <span className="text-white font-medium"> handle everything</span> in one unified platform.
                                </p>
                            </MaskedReveal>
                        </div>

                        {/* Buttons */}
                        <MaskedReveal delay={1.8}>
                            <div className="flex gap-4">
                                <button onClick={() => navigate('/signup')} className="group relative px-8 py-4 bg-white text-black rounded-sm font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95">
                                    <span className="relative z-10 flex items-center gap-2">
                                        Start Enterprise <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button className="px-8 py-4 text-white border-b border-white/20 hover:border-white transition-colors font-mono text-sm uppercase tracking-wider">
                                    Book Demo
                                </button>
                            </div>
                        </MaskedReveal>
                    </div>

                    {/* Orbit Visualization (Synced with AuthPage) */}
                    <motion.div
                        layoutId="orbit-visual"
                        className="relative w-full max-w-[600px] aspect-square flex items-center justify-center"
                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    >

                        {/* Center Core: Interface Projection */}
                        <div className="relative w-[320px] h-[200px] bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transform-gpu transition-all duration-500 z-10">
                            <div className={`absolute inset-0 bg-gradient-to-br ${activeModule.gradient} opacity-10 transition-colors duration-500`} />
                            <div className="absolute top-0 left-0 right-0 h-8 border-b border-white/5 bg-white/5 flex items-center px-3 gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                                <div className="ml-auto text-[10px] font-mono text-white/30">SYNC OS v2.0</div>
                            </div>
                            <div className="absolute inset-0 top-8">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.3 }} className="w-full h-full">
                                        {activeTab === 'chat' && <HeroChat />}
                                        {activeTab === 'tasks' && <HeroTasks />}
                                        {activeTab === 'notes' && <HeroNotes />}
                                        {activeTab === 'leave' && <HeroLeave />}
                                        {activeTab === 'projects' && <HeroProjects />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Orbiting Feature Nodes */}
                        <div className="absolute inset-0 pointer-events-none z-20">
                            {APP_MODULES.map((module, index) => {
                                const angle = (index / APP_MODULES.length) * 2 * Math.PI - (Math.PI / 2);
                                const radius = 240;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                const isActive = activeTab === module.id;

                                return (
                                    <motion.button key={module.id} className={`absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all duration-300 pointer-events-auto cursor-pointer ${isActive ? 'bg-white/20 border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-110 z-50' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/40 hover:text-white'}`} style={{ x, y }} onClick={() => setActiveTab(module.id)} whileHover={{ scale: 1.2, zIndex: 60 }} whileTap={{ scale: 0.95 }}>
                                        <module.icon className={`text-2xl transition-colors duration-300 ${isActive ? 'text-white' : ''}`} style={{ color: isActive ? module.color : undefined }} />
                                        <svg className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none overflow-visible">
                                            <motion.line x1="50%" y1="50%" x2={150 - x * 0.6} y2={150 - y * 0.6} stroke={module.color} strokeWidth="2" strokeDasharray="4 4" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: isActive ? 1 : 0, opacity: isActive ? 0.4 : 0 }} transition={{ duration: 0.5 }} />
                                        </svg>
                                        <motion.div className="absolute top-full mt-3 text-center w-32 bg-black/80 backdrop-blur text-xs px-2 py-1 rounded border border-white/10 pointer-events-none" initial={{ opacity: 0, y: -5 }} animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : -5 }}>
                                            <div className="font-bold text-white">{module.title}</div>
                                            <div className="text-[10px] text-slate-400">{module.desc}</div>
                                        </motion.div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Orbit Ring visual */}
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.8] animate-[spin_60s_linear_infinite]" />
                        <div className="absolute inset-0 rounded-full border border-dashed border-white/5 scale-[0.8] animate-[spin_40s_linear_infinite_reverse]" />
                    </motion.div>
                </div>

                {/* Scroll to features indicator - Hero specific design */}
                <motion.button
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.8 }}
                    onClick={() => {
                        const firstFeature = document.getElementById('feature-standups');
                        if (firstFeature) firstFeature.scrollIntoView({ behavior: 'smooth' });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Dynamic text */}
                    <motion.span
                        className="text-xs text-slate-500 uppercase tracking-[0.25em] font-light group-hover:text-indigo-400 transition-colors"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        Scroll to Begin
                    </motion.span>

                    {/* Elegant slim indicator */}
                    <div className="relative flex flex-col items-center">
                        {/* Outer glow ring */}
                        <motion.div
                            className="absolute -inset-4 rounded-full border border-indigo-500/20"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Center dot with pulse */}
                        <motion.div
                            className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-500/50"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />

                        {/* Vertical line */}
                        <motion.div
                            className="w-px h-8 bg-gradient-to-b from-indigo-400 to-transparent mt-2"
                            animate={{ opacity: [0.5, 1, 0.5], scaleY: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />

                        {/* Animated traveling dot */}
                        <motion.div
                            className="absolute top-3 w-1.5 h-1.5 rounded-full bg-white"
                            animate={{ y: [0, 32, 0], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </motion.button>
            </header>

            {/* Feature Showcase - Full Viewport Scroll Experience */}
            <section id="features" className="relative z-10 snap-y snap-mandatory" style={{ scrollSnapType: 'y mandatory' }}>
                {FEATURE_SHOWCASE.map((feature, index) => (
                    <FullViewportFeature key={feature.id} feature={feature} index={index} />
                ))}
            </section>

            {/* Enhanced Pricing Section */}
            <section id="pricing" className="relative z-10 py-24 px-6 overflow-hidden">
                {/* Subtle background */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent" />

                <div className="max-w-6xl mx-auto relative">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">
                            Pricing
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Choose your plan
                        </h2>
                        <p className="text-lg text-slate-400 max-w-xl mx-auto">
                            Start free and scale as your team grows. No credit card required.
                        </p>
                    </motion.div>

                    {/* Pricing Cards - Cleaner design */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                name: 'Free',
                                price: '$0',
                                period: '/month',
                                desc: 'For small teams getting started',
                                features: ['5 team members', '7-day history', 'Basic reports', 'Community support'],
                                popular: false,
                                cta: 'Get Started'
                            },
                            {
                                name: 'Pro',
                                price: '$12',
                                period: '/user/mo',
                                desc: 'For teams that need more power',
                                features: ['Unlimited members', 'Unlimited history', 'Advanced analytics', 'Priority support', 'Integrations', 'Admin controls'],
                                popular: true,
                                cta: 'Start Free Trial'
                            },
                            {
                                name: 'Enterprise',
                                price: 'Custom',
                                period: '',
                                desc: 'For large organizations',
                                features: ['Everything in Pro', 'SSO & SAML', 'SLA guarantee', 'Dedicated manager', 'Custom onboarding'],
                                popular: false,
                                cta: 'Contact Sales'
                            }
                        ].map((plan, i) => (
                            <motion.div
                                key={i}
                                className={`relative rounded-2xl p-6 ${plan.popular
                                    ? 'bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30'
                                    : 'bg-slate-800/30 border border-slate-700/50'
                                    }`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-xs font-bold">
                                        RECOMMENDED
                                    </div>
                                )}

                                {/* Plan name */}
                                <div className="text-sm font-medium text-slate-400 mb-2">{plan.name}</div>

                                {/* Price */}
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-slate-500 text-sm">{plan.period}</span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-400 mb-6">{plan.desc}</p>

                                {/* CTA Button */}
                                <motion.button
                                    onClick={() => navigate('/signup')}
                                    className={`w-full py-3 rounded-lg font-semibold text-sm mb-6 transition-all ${plan.popular
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
                                        : 'bg-slate-700/50 text-white hover:bg-slate-700'
                                        }`}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {plan.cta}
                                </motion.button>

                                {/* Features */}
                                <ul className="space-y-3">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                                            <FiCheck className={`w-4 h-4 ${plan.popular ? 'text-indigo-400' : 'text-slate-500'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom text */}
                    <p className="text-center text-sm text-slate-500 mt-8">
                        All plans include a 14-day free trial. No credit card required.
                    </p>
                </div>
            </section>

            {/* === TESTIMONIALS SECTION === */}
            <section className="relative z-10 py-24 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 mb-12">
                    <motion.div
                        className="text-center mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                            Testimonials
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Voices from the Cosmos
                        </h2>
                        <p className="text-lg text-slate-400 max-w-xl mx-auto">
                            Trusted by thousands of high-performing teams worldwide.
                        </p>
                    </motion.div>
                </div>

                {/* Infinite Scroll Carousel */}
                <div className="relative">
                    {/* Gradient Fade Left */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a12] to-transparent z-10 pointer-events-none" />
                    {/* Gradient Fade Right */}
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a12] to-transparent z-10 pointer-events-none" />

                    {/* Scrolling Row 1 (Left to Right) */}
                    <div
                        className="flex gap-6 mb-6"
                        style={{
                            animation: 'scroll-left 40s linear infinite'
                        }}
                    >
                        {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                            <TestimonialCard key={`row1-${t.id}-${i}`} testimonial={t} index={i % TESTIMONIALS.length} />
                        ))}
                    </div>

                    {/* Scrolling Row 2 (Right to Left) */}
                    <div
                        className="flex gap-6"
                        style={{
                            animation: 'scroll-right 45s linear infinite'
                        }}
                    >
                        {[...TESTIMONIALS.slice().reverse(), ...TESTIMONIALS.slice().reverse()].map((t, i) => (
                            <TestimonialCard key={`row2-${t.id}-${i}`} testimonial={t} index={i % TESTIMONIALS.length} />
                        ))}
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="max-w-4xl mx-auto px-6 mt-16">
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {[
                            { value: '10,000+', label: 'Teams Active' },
                            { value: '2M+', label: 'Standups Sent' },
                            { value: '99.9%', label: 'Uptime SLA' },
                            { value: '4.9/5', label: 'Average Rating' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                className="p-4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* CSS Keyframes for scroll animation */}
                <style>{`
                    @keyframes scroll-left {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    @keyframes scroll-right {
                        0% { transform: translateX(-50%); }
                        100% { transform: translateX(0); }
                    }
                `}</style>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-6 border-t border-white/5 text-center md:text-left">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-slate-500 text-sm">© 2026 Sync Inc.</div>
                    <div className="flex gap-6">
                        <FiTwitter className="text-slate-500 hover:text-white transition-colors cursor-pointer" />
                        <FiGithub className="text-slate-500 hover:text-white transition-colors cursor-pointer" />
                        <FiLinkedin className="text-slate-500 hover:text-white transition-colors cursor-pointer" />
                    </div>
                </div>
            </footer>

        </div>
    );
}
