import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTarget, FiAlertCircle, FiChevronRight, FiShield, FiInfo, FiX, FiActivity, FiSearch, FiCpu } from 'react-icons/fi';
import { getBlockerData } from '../../../services/analyticsService';
import { useCompany } from '../../../contexts/CompanyContext';

const BlockerRadar = () => {
    const { currentCompany } = useCompany();
    const [blockers, setBlockers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const fetchBlockers = async () => {
            if (!currentCompany?.id) return;
            setLoading(true);
            try {
                const data = await getBlockerData(currentCompany.id);
                setBlockers(data);
            } catch (error) {
                console.error('Blocker Radar acquisition failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlockers();
    }, [currentCompany]);

    if (loading) {
        return (
            <div className="w-full h-40 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden h-full min-h-[400px] shadow-2xl"
        >
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] -z-10" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <FiTarget className="text-rose-400" />
                    </div>
                    <h6 className="font-bold text-slate-300">Blocker Radar</h6>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all ml-1"
                    >
                        <FiInfo className="text-[10px]" />
                    </button>
                </div>
                <div className="text-[10px] font-mono text-rose-500/60 uppercase tracking-widest font-black">Scanning...</div>
            </div>

            <div className="space-y-3 flex-1 relative z-10">
                {blockers.length > 0 ? (
                    blockers.slice(0, 3).map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 group/entry cursor-help">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                                <div className="truncate">
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-tight">{b.name}</div>
                                    <div className="text-xs text-slate-300 truncate font-light italic">"{b.latest}"</div>
                                </div>
                            </div>
                            <div className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-2 py-1 rounded flex-shrink-0">
                                {b.count}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FiShield className="text-emerald-500/20 text-4xl mb-4" />
                        <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest font-black">Systems_Clear</p>
                        <p className="text-slate-500 text-[11px] mt-2">Zero roadblocks detected in active cycle.</p>
                    </div>
                )}
            </div>

            {blockers.length > 3 && (
                <div className="mt-4 text-right relative z-10">
                    <button className="text-[10px] font-mono text-slate-500 hover:text-white flex items-center gap-1 ml-auto transition-colors">
                        +{blockers.length - 3} MORE ENTITIES Detected <FiChevronRight />
                    </button>
                </div>
            )}

            {/* Scanning Effect Overlay */}
            <motion.div
                animate={{ y: [-200, 200] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/[0.04] to-transparent pointer-events-none"
            />

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
                                <FiCpu className="text-rose-400" /> Friction_Scanner.exe
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
                                    label: "Content Extraction",
                                    desc: "Heuristic scan of the `blockers` field in all daily reports submitted during the active 30-day window.",
                                    icon: <FiSearch className="text-rose-400" />
                                },
                                {
                                    label: "Entity Clustering",
                                    desc: "Identified roadblocks are grouped by department or team ID to map organizational congestion zones.",
                                    icon: <FiActivity className="text-indigo-400" />
                                },
                                {
                                    label: "Pulse Signature",
                                    desc: "Blockers are ranked by recurrence. High-density blocks indicate systemic architectural or process friction.",
                                    icon: <FiTarget className="text-emerald-400" />
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

export default BlockerRadar;
