import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiZap, FiActivity, FiInfo, FiX, FiCheckCircle, FiCpu } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnimatePresence } from 'framer-motion';
import { getDetailedVelocity } from '../../../services/analyticsService';
import { useCompany } from '../../../contexts/CompanyContext';

const VelocityEngine = () => {
    const { currentCompany } = useCompany();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        average: 0,
        peak: 0,
        trend: 0
    });

    useEffect(() => {
        const fetchVelocity = async () => {
            if (!currentCompany?.id) return;

            setLoading(true);
            try {
                const dailyData = await getDetailedVelocity(currentCompany.id);
                setData(dailyData);

                // Calculate stats
                const total = dailyData.reduce((sum, d) => sum + d.velocity, 0);
                const average = (total / dailyData.length).toFixed(1);
                const peak = Math.max(...dailyData.map(d => d.velocity));

                // Compare last 3 days vs previous 3 days for trend
                const last3 = dailyData.slice(-3).reduce((sum, d) => sum + d.velocity, 0);
                const prev3 = dailyData.slice(-6, -3).reduce((sum, d) => sum + d.velocity, 0);
                const trend = prev3 === 0 ? 100 : (((last3 - prev3) / prev3) * 100).toFixed(0);

                setStats({ total, average, peak, trend });
            } catch (error) {
                console.error('Velocity Engine failed to fire:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVelocity();
    }, [currentCompany]);

    if (loading) {
        return (
            <div className="w-full h-[450px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Reconciling_States...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden h-full min-h-[400px] shadow-2xl"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -z-10" />

            <div className="flex flex-col h-full relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <FiZap className="text-indigo-400 text-xl" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Velocity Engine</h3>
                            <button
                                onClick={() => setShowInfo(true)}
                                className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all ml-1"
                            >
                                <FiInfo className="text-xs" />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm font-light">Real-time throughput analysis of completed efforts.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Avg_Daily</div>
                            <div className="text-xl font-black text-white">{stats.average}d</div>
                        </div>
                        <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Trend</div>
                            <div className={`text-xl font-black ${stats.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stats.trend > 0 ? '+' : ''}{stats.trend}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                                                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">{payload[0].payload.date}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl font-black text-white">{payload[0].value}d</div>
                                                    <div className="text-xs text-slate-400">({payload[0].payload.count} tasks)</div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="velocity"
                                stroke="#6366f1"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#velocityGradient)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Total Effort</div>
                        <div className="text-lg font-bold text-white">{stats.total} days</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Peak Output</div>
                        <div className="text-lg font-bold text-white">{stats.peak} days</div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end text-right">
                        <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/10">
                            <FiActivity className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Systems_Optimal</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculation Info Modal */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl p-6 flex flex-col rounded-[2.5rem] border border-white/10"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <FiCpu className="text-indigo-400" />
                                </div>
                                <h4 className="text-lg font-bold text-white uppercase tracking-tighter">Engine_Logic.exe</h4>
                            </div>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                {
                                    label: "Velocity Calculation",
                                    desc: "Sum of `efforts_in_days` for all tasks strictly transitioned to 'Completed' within a 24-hour cycle.",
                                    icon: <FiCheckCircle className="text-emerald-400" />
                                },
                                {
                                    label: "Rolling Average",
                                    desc: "Calculated across a 14-day trailing window to normalize high-output bursts and focus on sustainable pace.",
                                    icon: <FiActivity className="text-indigo-400" />
                                },
                                {
                                    label: "Trend Index",
                                    desc: "A comparison of the latest 72-hour throughput against the preceding 72-hour block to detect momentum shifts.",
                                    icon: <FiTrendingUp className="text-amber-400" />
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                                >
                                    <div className="mt-1 text-lg">{item.icon}</div>
                                    <div>
                                        <div className="text-sm font-black text-white mb-1 uppercase tracking-tight">{item.label}</div>
                                        <p className="text-xs text-slate-400 leading-relaxed font-light">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 text-center">
                            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest italic">
                                // Precision is the foundation of alignment
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default VelocityEngine;
