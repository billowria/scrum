import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiInfo, FiX, FiActivity, FiTarget, FiMessageSquare } from 'react-icons/fi';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getEngagementData } from '../../../services/analyticsService';
import { useCompany } from '../../../contexts/CompanyContext';

const TeamEngagementRadar = () => {
    const { currentCompany } = useCompany();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const fetchEngagement = async () => {
            if (!currentCompany?.id) return;
            setLoading(true);
            try {
                const engagementData = await getEngagementData(currentCompany.id);
                setData(engagementData);
            } catch (error) {
                console.error('Engagement Radar malfunction:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEngagement();
    }, [currentCompany]);

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Sensing_Dynamics...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden h-full min-h-[440px] group shadow-2xl"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                            <FiUsers className="text-emerald-400 text-xl" />
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight">Engagement Radar</h4>
                        <button
                            onClick={() => setShowInfo(true)}
                            className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all ml-1 hover:scale-110"
                        >
                            <FiInfo className="text-xs" />
                        </button>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">Status</div>
                    <div className="text-xs font-bold text-white uppercase tracking-tighter bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">Optimal_Sync</div>
                </div>
            </div>

            <div className="h-[240px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Team Alpha"
                            dataKey="A"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.5}
                            animationDuration={2000}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-2xl">
                                            <p className="text-[10px] font-mono text-emerald-400 uppercase mb-1">{payload[0].payload.subject}</p>
                                            <div className="text-xl font-bold text-white">{payload[0].value}%</div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <p className="mt-6 text-slate-400 text-xs font-light leading-relaxed relative z-10">
                Analysis of report patterns reveals high consistency in peer updates but a need for deeper blocker articulation.
            </p>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl p-8 flex flex-col rounded-[2.5rem] border border-white/10"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-lg font-bold text-white uppercase tracking-tighter flex items-center gap-3">
                                <FiActivity className="text-emerald-400" /> Metrics_Definition
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
                                { label: "Consistency", desc: "Percentage of required workdays where a standup report was logged by the team.", icon: <FiActivity className="text-emerald-400" /> },
                                { label: "Detail Level", desc: "Average semantic density of reports. Measures if updates are actionable or vague.", icon: <FiMessageSquare className="text-indigo-400" /> },
                                { label: "Task Alignment", desc: "Correlation between mentioned task IDs in reports and active project boards.", icon: <FiTarget className="text-amber-400" /> }
                            ].map((m, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[10px] font-black text-white uppercase mb-1">{m.label}</div>
                                    <p className="text-[11px] text-slate-400 font-light">{m.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TeamEngagementRadar;
