import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUsers, FiSave } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';

export default function CreateTeamModal({ isOpen, onClose, team, onSuccess, showToast }) {
    const { currentCompany } = useCompany();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(team ? team.name : '');
        }
    }, [isOpen, team]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            if (team) {
                // Update
                const { error } = await supabase
                    .from('teams')
                    .update({ name: name.trim() })
                    .eq('id', team.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('teams')
                    .insert([{
                        name: name.trim(),
                        company_id: currentCompany.id
                    }]);
                if (error) throw error;
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving team:', error);
            showToast('error', 'Operation failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/40 dark:border-slate-800/50 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative px-8 pt-8 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                                        <FiUsers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {team ? 'Refine Workspace' : 'Initialize Team'}
                                        </h3>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                            {team ? 'Updating core parameters' : 'New organizational unit'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-400 dark:text-slate-500"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="px-8 pb-8">
                            <div className="mb-8 space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team Identity</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Design Ops, Frontend"
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-bold text-lg placeholder:text-gray-300 dark:placeholder:text-slate-600"
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                                >
                                    Discard
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="flex-[1.5] py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 group"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FiSave className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                            {team ? 'Synchronize' : 'Authorize'}
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
