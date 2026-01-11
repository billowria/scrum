// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QuantumBackground from '../components/shared/QuantumBackground';
import {
    FiArrowRight, FiCheck, FiMessageCircle, FiCheckSquare, FiCalendar, FiEdit3,
    FiSend, FiStar, FiMenu, FiX, FiGithub, FiTwitter, FiLinkedin, FiLayers, FiClock
} from 'react-icons/fi';

// --- Configuration (Shared with AuthPage) ---
const APP_MODULES = [
    { id: 'chat', title: 'Start Sync', icon: FiMessageCircle, color: '#ec4899', desc: "Team Communication", gradient: "from-pink-500 to-rose-500" },
    { id: 'tasks', title: 'Track Work', icon: FiCheckSquare, color: '#f59e0b', desc: "Kanban Boards", gradient: "from-amber-400 to-orange-500" },
    { id: 'notes', title: 'Share Knowledge', icon: FiEdit3, color: '#10b981', desc: "Wiki & Docs", gradient: "from-emerald-400 to-teal-500" },
    { id: 'leave', title: 'Manage Time', icon: FiCalendar, color: '#3b82f6', desc: "Leave Calendar", gradient: "from-blue-400 to-cyan-500" },
    { id: 'projects', title: 'Ship Faster', icon: FiLayers, color: '#8b5cf6', desc: "Project Views", gradient: "from-violet-500 to-purple-600" },
];

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
    const [activeTab, setActiveTab] = useState('chat');
    const [menuOpen, setMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    // AuthPage Logic for Hero Animation
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        // Auto-cycle tabs for hero
        const timer = setInterval(() => {
            setActiveTab(prev => {
                const idx = APP_MODULES.findIndex(m => m.id === prev);
                return APP_MODULES[(idx + 1) % APP_MODULES.length].id;
            });
        }, 3000);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
        };
    }, []);

    const activeModule = APP_MODULES.find(m => m.id === activeTab);

    return (
        <div className="min-h-screen bg-[#0a0b14] text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Ambient Background (Exact Match to AuthPage) */}
            <QuantumBackground />

            {/* Navbar */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0b14]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><FiLayers className="text-white w-4 h-4" /></div>
                        SYNC
                    </div>
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
                    <div>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-8">
                            Sync your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">team brain.</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-xl md:text-2xl text-slate-400 max-w-lg leading-relaxed mb-12">
                            The operating system for agile teams. Async standups, planning, and knowledge living in perfect harmony.
                        </motion.p>
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex gap-4">
                            <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">Start Free <FiArrowRight /></button>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">See Demo</button>
                        </motion.div>
                    </div>

                    {/* Orbit Visualization (Synced with AuthPage) */}
                    <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center">

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
                    </div>
                </div>
            </header>

            {/* Features (Cardless / Z-Pattern) */}
            <Section align="right" title="Talk less, ship more." desc="Replace daily standup meetings with asynchronous updates. Keep everyone aligned without breaking flow state." tag="Communication">
                <MockChat />
            </Section>

            <Section align="left" title="Clarity at scale." desc="Visualize your team's velocity and blockers in real-time. Spot patterns before they become problems." tag="Analytics">
                <MockStats />
            </Section>

            <Section align="right" title="Work flows freely." desc="A modern Kanban board that links directly to your daily updates. Drag, drop, done." tag="Management">
                <MockKanban />
            </Section>

            {/* Simplified Pricing */}
            <section id="pricing" className="relative z-10 py-32 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-20 text-center">Fair pricing for all.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { name: 'Starter', price: '$0', desc: 'For individuals and hobbyists', features: ['Up to 5 members', '7-day history', 'Community support'] },
                            { name: 'Pro', price: '$29', desc: 'For growing teams', features: ['Unlimited members', 'Unlimited history', 'Priority support', 'Advanced analytics'] },
                            { name: 'Enterprise', price: 'Custom', desc: 'For large organizations', features: ['SLA guarantee', 'Dedicated success manager', 'Custom integrations'] }
                        ].map((plan, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="text-xl font-bold mb-2">{plan.name}</div>
                                <div className="text-4xl font-bold mb-4">{plan.price}</div>
                                <p className="text-slate-400 mb-8 pb-8 border-b border-white/10">{plan.desc}</p>
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex gap-3 text-slate-300"><FiCheck className="text-indigo-400 shrink-0" /> {f}</li>
                                    ))}
                                </ul>
                                <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-colors font-bold">Choose {plan.name}</button>
                            </div>
                        ))}
                    </div>
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
