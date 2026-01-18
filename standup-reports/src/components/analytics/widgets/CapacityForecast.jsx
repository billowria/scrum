import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiShield, FiAlertTriangle, FiInfo, FiX, FiCpu, FiUserPlus, FiLayers } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCapacityData } from '../../../services/analyticsService';
import { useCompany } from '../../../contexts/CompanyContext';

const CapacityForecast = () => {
    const { currentCompany } = useCompany();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const fetchCapacity = async () => {
            if (!currentCompany?.id) return;
            setLoading(true);
            try {
                const capacityData = await getCapacityData(currentCompany.id);
                setData(capacityData);
            } catch (error) {
                console.error('Capacity Forecast system failure:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCapacity();
    }, [currentCompany]);

    if (loading || !data) {
        return (
            <div className="w-full h-[400px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    const loadPercentage = ((data.summary.activeEffort / data.summary.totalCapacity) * 100).toFixed(0);
    const riskLevel = loadPercentage > 85 ? 'High' : loadPercentage > 60 ? 'Medium' : 'Optimal';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden h-full min-h-[400px] shadow-2xl"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -z-10" />

            <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-8 h-8 rounded-lg ${riskLevel === 'High' ? 'bg-rose-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
                                <FiCalendar className={riskLevel === 'High' ? 'text-rose-400' : 'text-amber-400'} />
                            </div>
                            <h5 className="font-bold text-slate-200">Capacity Forecast</h5>
                            <button
                                onClick={() => setShowInfo(true)}
                                className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all ml-1"
                            >
                                <FiInfo className="text-[10px]" />
                            </button>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Next_14_Days</p>
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-black text-white">{loadPercentage}%</div>
                        <div className={`text-[10px] font-bold uppercase ${riskLevel === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {riskLevel}_Load
                        </div>
                    </div>
                </div>

                <div className="flex-1 h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 9 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900 border border-white/10 p-2 rounded-lg shadow-xl">
                                                <div className="text-[10px] text-slate-500 mb-1">{payload[0].payload.date}</div>
                                                <div className="flex gap-3 text-xs">
                                                    <span className="text-indigo-400">Budget: {payload[0].value}d</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="capacity"
                                fill="#6366f1"
                                radius={[4, 4, 0, 0]}
                                opacity={0.6}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Available</div>
                        <div className="text-sm font-bold text-white">{data.summary.totalCapacity} Man-Days</div>
                    </div>
                    <FiShield className={riskLevel === 'High' ? 'text-rose-400' : 'text-indigo-400'} size={20} />
                </div>
            </div>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl p-6 flex flex-col rounded-[2.5rem] border border-white/10"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                <FiCpu className="text-amber-400" /> Availability_Audit.log
                            </h4>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    label: "Budget Calculation",
                                    desc: "Aggregate calculation of `(Total_Users - Approved_Leaves) * Workdays`. Weekend cycles are excluded.",
                                    icon: <FiUserPlus className="text-amber-400" />
                                },
                                {
                                    label: "Saturation Threshold",
                                    desc: "System triggers 'High Risk' if active efforts consume >85% of total man-day budget.",
                                    icon: <FiLayers className="text-indigo-400" />
                                },
                                {
                                    label: "Projections",
                                    desc: "Linear distribution of current board efforts over a normalized 10-day operational block.",
                                    icon: <FiArrowRight className="text-emerald-400" />
                                }
                            ].map((m, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[9px] font-black text-white uppercase mb-1 flex items-center gap-2">
                                        {m.icon} {m.label}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-light leading-relaxed">{m.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CapacityForecast;
