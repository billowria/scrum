// src/pages/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// QuantumBackground handled by PublicLayout
import squadSyncLogo from '../assets/brand/squadsync-logo.png';
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
        id: 'communication',
        tag: 'Communication',
        title: 'Talk less, ship more.',
        desc: 'Replace daily standup meetings with asynchronous updates. Keep everyone aligned without breaking flow state.',
        Icon: FiMessageCircle,
        gradient: 'from-pink-500 via-rose-500 to-red-500',
        bgGradient: 'from-pink-500/20 via-transparent to-transparent',
        features: ['Real-time chat', 'Thread discussions', 'File sharing', 'Integrations'],
        mockType: 'chat'
    },
    {
        id: 'analytics',
        tag: 'Analytics',
        title: 'Clarity at scale.',
        desc: "Visualize your team's velocity and blockers in real-time. Spot patterns before they become problems.",
        Icon: FiPieChart,
        gradient: 'from-indigo-500 via-purple-500 to-violet-500',
        bgGradient: 'from-indigo-500/20 via-transparent to-transparent',
        features: ['Sprint analytics', 'Burndown charts', 'Team metrics', 'Custom reports'],
        mockType: 'stats'
    },
    {
        id: 'tasks',
        tag: 'Task Management',
        title: 'Work flows freely.',
        desc: 'A modern Kanban board that links directly to your daily updates. Drag, drop, done.',
        Icon: FiCheckSquare,
        gradient: 'from-amber-400 via-orange-500 to-red-500',
        bgGradient: 'from-amber-500/20 via-transparent to-transparent',
        features: ['Kanban boards', 'Sprint planning', 'Subtasks', 'Time tracking'],
        mockType: 'kanban'
    },
    {
        id: 'calendar',
        tag: 'Time Management',
        title: 'Time is on your side.',
        desc: 'Integrated leave management and timesheets. Track holidays, time-off, and work hours in one beautiful view.',
        Icon: FiCalendar,
        gradient: 'from-blue-400 via-cyan-500 to-teal-500',
        bgGradient: 'from-blue-500/20 via-transparent to-transparent',
        features: ['Leave calendar', 'Holidays', 'Timesheet', 'Attendance'],
        mockType: 'calendar'
    },
    {
        id: 'notes',
        tag: 'Knowledge Base',
        title: 'Shared brainpower.',
        desc: 'A powerful knowledge base for your team. Create wikis, docs, and guidelines that live right next to your code.',
        Icon: FiEdit3,
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
        bgGradient: 'from-emerald-500/20 via-transparent to-transparent',
        features: ['Rich editor', 'Team wikis', 'Templates', 'Version history'],
        mockType: 'notes'
    },
    {
        id: 'admin',
        tag: 'Administration',
        title: 'Command center.',
        desc: 'Effortless admin tools. Manage users, projects, and permissions with granular control and total visibility.',
        Icon: FiShield,
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
        bgGradient: 'from-violet-500/20 via-transparent to-transparent',
        features: ['User management', 'Role permissions', 'Project settings', 'Audit logs'],
        mockType: 'admin'
    }
];

// --- Animated Logo Component ---
const AnimatedLogo = () => (
    <div className="relative flex items-center gap-3 group cursor-pointer">

        {/* Text */}
        <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Sync
            </span>
        </div>
    </div>
);

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
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className={`flex gap-3 mb-4 ${i === 2 ? 'flex-row-reverse' : ''}`}>
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
                    <motion.div key={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + card * 0.1 }} className="p-3 rounded-xl bg-white/5 border border-white/5 mb-3 hover:bg-white/10 transition-colors">
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
                    <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} className="w-3 bg-indigo-500/50 rounded-t-sm" />
                ))}
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Sprint Completion</span><span className="text-white font-bold">92%</span></div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '92%' }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" /></div>
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
                    <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.01 }}
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
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/5 rounded-xl p-4 border border-white/5">
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
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.3 }} className="w-24 h-16 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"><FiEdit3 className="text-emerald-400 text-xl" /></motion.div>
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.4 }} className="flex-1 h-16 rounded-lg bg-white/5 border border-white/5" />
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
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
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

// --- Full Viewport Feature Component ---
const FullViewportFeature = ({ feature, index }) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 0.5, 1], [80, 0, -80]);
    const bgOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 0.6, 0]);

    const Icon = feature.Icon;

    // Mock component mapping
    const MockComponents = {
        chat: MockChat,
        stats: MockStats,
        kanban: MockKanban,
        calendar: MockCalendar,
        notes: MockNotes,
        admin: MockAdmin
    };
    const MockComponent = MockComponents[feature.mockType];

    return (
        <motion.div
            ref={containerRef}
            id={`feature-${feature.id}`}
            className="h-screen w-full relative flex items-center justify-center px-6 overflow-hidden snap-start snap-always"
            style={{ height: '100vh', minHeight: '100vh' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.5 }}
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
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.5 }}
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
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: false, amount: 0.5 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {feature.title}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        className="text-xl text-slate-400 leading-relaxed mb-8 max-w-lg"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.5 }}
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
                                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                                viewport={{ once: false, amount: 0.5 }}
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
                    whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
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

            {/* Progress indicator */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
                {FEATURE_SHOWCASE.map((f, i) => (
                    <motion.div
                        key={i}
                        className={`w-2 h-10 rounded-full cursor-pointer transition-all duration-300 ${i === index ? `bg-gradient-to-b ${feature.gradient} shadow-lg` : 'bg-white/10 hover:bg-white/20'}`}
                        whileHover={{ scale: 1.2 }}
                    />
                ))}
            </div>

            {/* Scroll for more indicator */}
            {index < FEATURE_SHOWCASE.length - 1 && (
                <motion.button
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer hover:scale-110 transition-transform"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.8 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    onClick={() => {
                        const nextFeature = document.getElementById(`feature-${FEATURE_SHOWCASE[index + 1].id}`);
                        if (nextFeature) {
                            nextFeature.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Text */}
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-medium hover:text-white transition-colors">
                        Click to explore
                    </span>

                    {/* Animated mouse/scroll icon */}
                    <motion.div
                        className="relative w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
                        animate={{ borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.div
                            className={`w-1.5 h-3 rounded-full bg-gradient-to-b ${feature.gradient}`}
                            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>

                    {/* Animated chevrons */}
                    <div className="flex flex-col -mt-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, 4, 0], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                            >
                                <FiArrowRight className="rotate-90 text-white/40 w-4 h-4 -my-1.5" />
                            </motion.div>
                        ))}
                    </div>
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
                    <div className="relative">
                        {/* Floating decorative elements */}
                        <motion.div
                            className="absolute -left-20 top-10 w-72 h-72 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Enterprise Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm mb-6"
                        >
                            <motion.div
                                className="w-2 h-2 rounded-full bg-indigo-400"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Enterprise-Grade Team Operating System
                            </span>
                        </motion.div>

                        {/* Main Headline with word-by-word reveal */}
                        <div className="mb-6">
                            <motion.h1
                                className="text-6xl md:text-8xl font-black tracking-tight leading-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                {["One", "platform.", "Infinite", "teams."].map((word, i) => (
                                    <motion.span
                                        key={i}
                                        className={i >= 2 ? "block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" : "block"}
                                        initial={{ opacity: 0, y: 20, rotateX: -90 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        transition={{
                                            duration: 0.8,
                                            delay: 0.5 + (i * 0.15),
                                            type: "spring",
                                            stiffness: 100
                                        }}
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </motion.h1>
                        </div>

                        {/* Enhanced Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-lg leading-relaxed mb-8"
                        >
                            Orchestrate entire companies with multiple teams. From async standups to sprint planning—all in one unified workspace.
                        </motion.p>

                        {/* Feature Pills */}
                        <motion.div
                            className="flex flex-wrap gap-3 mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.3 }}
                        >
                            {[
                                { icon: FiUsers, text: "Multi-Company", color: "from-blue-500 to-cyan-500" },
                                { icon: FiLayers, text: "Unlimited Teams", color: "from-purple-500 to-pink-500" },
                                { icon: FiZap, text: "Real-time Sync", color: "from-amber-500 to-orange-500" }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 1.4 + (i * 0.1) }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feature.color} bg-opacity-10 border border-white/10 backdrop-blur-sm`}
                                >
                                    <feature.icon className="w-4 h-4 text-white" />
                                    <span className="text-sm font-medium text-white">{feature.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA Buttons with enhanced effects */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.7 }}
                            className="flex flex-wrap gap-4 mb-10"
                        >
                            <motion.button
                                onClick={() => navigate('/signup')}
                                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg overflow-hidden"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                                <span className="relative flex items-center gap-2 group-hover:text-white transition-colors">
                                    Start Free Trial
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <FiArrowRight />
                                    </motion.div>
                                </span>
                            </motion.button>

                            <motion.button
                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 backdrop-blur-sm transition-all"
                                whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
                                whileTap={{ scale: 0.98 }}
                            >
                                See Demo
                            </motion.button>
                        </motion.div>

                        {/* Animated Stats Counter */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.9 }}
                            className="flex items-center gap-8 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                        >
                            {[
                                { value: "500+", label: "Companies" },
                                { value: "5K+", label: "Teams" },
                                { value: "50K+", label: "Users" }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    className="flex flex-col"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 2.0 + (i * 0.1) }}
                                >
                                    <motion.div
                                        className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 2.1 + (i * 0.1) }}
                                    >
                                        {stat.value}
                                    </motion.div>
                                    <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
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

                {/* Scroll to features indicator */}
                <motion.button
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    onClick={() => {
                        const firstFeature = document.getElementById('feature-communication');
                        if (firstFeature) {
                            firstFeature.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-medium hover:text-white transition-colors">
                        Discover Features
                    </span>

                    <motion.div
                        className="relative w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
                        animate={{ borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.div
                            className="w-1.5 h-3 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400"
                            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>

                    <div className="flex flex-col -mt-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, 4, 0], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                            >
                                <FiArrowRight className="rotate-90 text-white/40 w-4 h-4 -my-1.5" />
                            </motion.div>
                        ))}
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
