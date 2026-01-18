import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiAlertOctagon, FiTerminal, FiCpu, FiEye, FiInfo, FiX } from 'react-icons/fi';
import { getSentinelAnalysis } from '../../../services/analyticsService';
import { useCompany } from '../../../contexts/CompanyContext';

const SentinelAnalysis = () => {
    const { currentCompany } = useCompany();
    const [risks, setRisks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const runDiagnostics = async () => {
            if (!currentCompany?.id) return;
            setLoading(true);
            try {
                const diagnosis = await getSentinelAnalysis(currentCompany.id);
                setRisks(diagnosis);
            } catch (error) {
                console.error('Sentinel Diagnostic Error:', error);
            } finally {
                setLoading(false);
            }
        };

        runDiagnostics();
    }, [currentCompany]);

    if (loading) {
        return (
            <div className="w-full h-40 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
            </div>
        );
    }

    const criticalRisks = risks.filter(r => r.severity === 'Critical');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden h-full min-h-[400px] shadow-2xl"
        >
            {/* Matrix Decorative Layer */}
            <div className="absolute inset-0 opacity-10 pointer-events-none font-mono text-[8px] text-indigo-500 overflow-hidden break-all whitespace-pre-wrap leading-none select-none -z-10">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
                        {Array.from({ length: 50 }).map(() => Math.random() > 0.5 ? '1' : '0').join('')}
                    </div>
                ))}
            </div>

            <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center ring-1 ring-indigo-500/20">
                            <FiEye className="text-indigo-400" />
                        </div>
                        <h6 className="font-bold text-slate-300">Sentinel Analysis</h6>
                        <button
                            onClick={() => setShowInfo(true)}
                            className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all ml-1"
                        >
                            <FiInfo className="text-[10px]" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">Online</span>
                    </div>
                </div>

                <div className="space-y-3 flex-1">
                    {risks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <FiShield className="text-emerald-500/20 mb-4" size={48} />
                            <p className="text-emerald-400/60 font-mono text-[10px] uppercase tracking-widest font-bold">Systems_Clear</p>
                            <p className="text-slate-500 text-[11px] mt-2">No operational anomalies detected in current cycle.</p>
                        </div>
                    ) : (
                        risks.map((risk, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${risk.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' :
                                            risk.severity === 'High' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-indigo-500/20 text-indigo-400'
                                        }`}>
                                        <FiAlertOctagon size={14} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{risk.title}</div>
                                        <div className="text-[9px] text-slate-500 leading-none mt-0.5">{risk.description}</div>
                                    </div>
                                </div>
                                <div className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${risk.severity === 'Critical' ? 'border-rose-500/30 text-rose-500' : 'border-slate-500/30 text-slate-500'
                                    }`}>
                                    {risk.severity.toUpperCase()}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {criticalRisks.length > 0 && (
                    <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <FiAlertOctagon /> ACTION_REQUIRED
                    </div>
                )}
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
                                <FiCpu className="text-indigo-400" /> Sentinel_Protocol.md
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
                                { id: "RV-01", label: "Velocity Decay", desc: "Cross-checks 3-cycle trailing averages. Alerts on >20% throughput contraction." },
                                { id: "AG-03", label: "Alignment Gap", desc: "Monitors daily report detail and consistency indices. Prevents mission drift." },
                                { id: "RS-09", label: "Resource Saturation", desc: "Detects load-to-bandwidth exceeding 0.85 saturation coefficient." },
                                { id: "FD-05", label: "Friction Density", desc: "Triggers on unresolved blocker accumulation across department clusters." }
                            ].map((m, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[9px] font-black text-white uppercase">{m.label}</div>
                                        <div className="text-[8px] font-mono text-indigo-500">CODE: {m.id}</div>
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

export default SentinelAnalysis;
