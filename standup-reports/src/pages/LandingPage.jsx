// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

// --- Hero Mock Components (Exact copies from AuthPage for consistency) ---
const HeroChat = () => (
    <div className="flex flex-col h-full p-4 gap-3">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1"><div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center"><FiMessageCircle className="text-pink-400 text-sm" /></div><div className="text-xs font-medium text-white/90">#general</div></div>
        {[1, 2, 3].map((i) => (<motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className={`flex gap - 2 ${i === 2 ? 'flex-row-reverse' : ''} `}><div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" /><div className={`p - 2 rounded - lg text - [10px] max - w - [80 %] ${i === 2 ? 'bg-pink-500/20 text-pink-100' : 'bg-white/5 text-slate-300'} `}><div className="h-2 w-24 bg-current opacity-20 rounded mb-1" /><div className="h-2 w-16 bg-current opacity-10 rounded" /></div></motion.div>))}
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
        <div className="space-y-2 flex-1">{[1, 2, 3].map(i => <motion.div key={i} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 0.2 + i * 0.15 }} className="h-2 bg-white/10 rounded" />)}</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30" />)}</motion.div>
    </div>
);
const HeroLeave = () => (
    <div className="h-full p-3 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><FiCalendar className="text-blue-400" /> Leave Calendar</div>
        <div className="grid grid-cols-7 gap-1 flex-1">{Array.from({ length: 21 }).map((_, i) => { const isLeave = [3, 10, 17].includes(i); return <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.02 }} className={`aspect - square rounded text - [8px] flex items - center justify - center ${isLeave ? 'bg-blue-500/30 text-blue-200' : 'bg-white/5 text-slate-500'} `}>{(i % 7) + 1}</motion.div>; })}</div>
    </div>
);
const HeroProjects = () => (
    <div className="h-full p-3 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mb-1"><FiLayers className="text-violet-400" /> Active Projects</div>
        {[{ name: 'Mobile App', progress: 75 }, { name: 'Dashboard', progress: 45 }].map((p, i) => (<motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.15 }} className="p-2 rounded-lg bg-white/5 border border-white/5"><div className="flex justify-between text-[10px] mb-1"><span className="text-white/80">{p.name}</span><span className="text-violet-400">{p.progress}%</span></div><div className="h-1 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}% ` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }} className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" /></div></motion.div>))}
    </div>
);

// --- Mock UIs for Feature Sections ---
const MockChat = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-3xl rounded-full" />
        <div className="flex items-center gap-3 border-b border-white/10 pb-4"><div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center"><FiMessageCircle className="text-pink-400" /></div><div><div className="text-sm font-bold">#product-team</div><div className="text-xs text-slate-500">12 members online</div></div></div>
        {[{ name: 'Alex', msg: 'Shipped the new dashboard! 🚀', time: '2m', self: false }, { name: 'You', msg: 'Amazing work! Looks great.', time: 'now', self: true }].map((m, i) => (<motion.div key={i} initial={{ opacity: 0, x: m.self ? 20 : -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className={`flex gap - 3 ${m.self ? 'flex-row-reverse' : ''} `}><div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold border border-white/10">{m.name[0]}</div><div className={`px - 4 py - 2 rounded - 2xl max - w - [70 %] ${m.self ? 'bg-indigo-500/20 text-indigo-100 rounded-br-sm' : 'bg-white/5 text-slate-300 rounded-bl-sm'} `}><div className="text-sm">{m.msg}</div><div className="text-[10px] text-slate-500 mt-1">{m.time}</div></div></motion.div>))}
        <div className="flex items-center gap-2 mt-2 p-3 rounded-full bg-white/5 border border-white/10"><input type="text" placeholder="Type a message..." className="flex-1 bg-transparent text-sm outline-none placeholder-slate-500" /><FiSend className="text-indigo-400 cursor-pointer hover:text-indigo-300" /></div>
    </div>
);

const MockKanban = () => (
    <div className="w-full max-w-lg mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-3 overflow-hidden relative">
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full" />
        {[{ title: 'To Do', count: 4, color: 'bg-slate-500' }, { title: 'In Progress', count: 3, color: 'bg-amber-500' }, { title: 'Done', count: 8, color: 'bg-emerald-500' }].map((col, i) => (<motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><div className={`w - 2 h - 2 rounded - full ${col.color} `} /><span className="text-xs font-bold text-slate-300">{col.title}</span></div><span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{col.count}</span></div><div className="space-y-2">{[1, 2].map((card) => (<motion.div key={card} initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 + card * 0.05 }} className="p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-amber-500/30 transition-colors cursor-pointer group"><div className="h-2 w-4/5 bg-white/20 rounded mb-2" /><div className="flex justify-between items-center"><div className="flex -space-x-1">{[1, 2].map(a => <div key={a} className="w-4 h-4 rounded-full bg-slate-700 border border-slate-600" />)}</div><FiCheckSquare className="text-slate-500 group-hover:text-amber-400 transition-colors" /></div></motion.div>))}</div></motion.div>))}
    </div>
);

const MockStats = () => (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="flex justify-between items-center mb-6"><div className="font-bold text-lg">Team Velocity</div><div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">+12%</div></div>
        <div className="h-32 flex items-end gap-2">{[40, 65, 45, 80, 55, 90, 70].map((h, i) => (<motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}% ` }} transition={{ delay: i * 0.1, duration: 0.5 }} className="flex-1 bg-gradient-to-t from-indigo-500/50 to-purple-500/50 rounded-t-lg hover:from-indigo-400/60 hover:to-purple-400/60 transition-colors cursor-pointer" />))}</div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-3 gap-4 mt-6">{[{ label: 'Tasks Done', value: '127', color: 'text-emerald-400' }, { label: 'In Progress', value: '34', color: 'text-amber-400' }, { label: 'Blocked', value: '8', color: 'text-rose-400' }].map((s, i) => (<motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="text-center"><div className={`text - 2xl font - bold ${s.color} `}>{s.value}</div><div className="text-xs text-slate-500">{s.label}</div></motion.div>))}</div>
    </div>
);

// --- Section Component ---
const Section = ({ align = 'left', title, desc, tag, children }) => (
    <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: align === 'left' ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className={align === 'right' ? 'md:order-2' : ''}>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">{tag}</div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{title}</h2>
                <p className="text-lg text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: align === 'left' ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className={align === 'right' ? 'md:order-1' : ''}>{children}</motion.div>
        </div>
    </section>
);

export default function LandingPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('chat');
    const { scrollY } = useScroll();

    // Auto-cycle tabs for hero
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveTab(prev => {
                const idx = APP_MODULES.findIndex(m => m.id === prev);
                return APP_MODULES[(idx + 1) % APP_MODULES.length].id;
            });
        }, 3000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const activeModule = APP_MODULES.find(m => m.id === activeTab);

    return (
        <>
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
                            <div className={`absolute inset - 0 bg - gradient - to - br ${activeModule.gradient} opacity - 10 transition - colors duration - 500`} />
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
                                    <motion.button key={module.id} className={`absolute top - 1 / 2 left - 1 / 2 w - 16 h - 16 - ml - 8 - mt - 8 rounded - 2xl flex items - center justify - center backdrop - blur - md border transition - all duration - 300 pointer - events - auto cursor - pointer ${isActive ? 'bg-white/20 border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-110 z-50' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/40 hover:text-white'} `} style={{ x, y }} onClick={() => setActiveTab(module.id)} whileHover={{ scale: 1.2, zIndex: 60 }} whileTap={{ scale: 0.95 }}>
                                        <module.icon className={`text - 2xl transition - colors duration - 300 ${isActive ? 'text-white' : ''} `} style={{ color: isActive ? module.color : undefined }} />
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
        </>
    );
}
