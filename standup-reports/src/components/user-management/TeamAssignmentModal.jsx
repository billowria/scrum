import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiUsers, FiStar, FiUserCheck, FiSearch, FiLayers, FiBriefcase } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';

const getTeamColor = (index) => {
    const colors = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-red-600',
        'from-pink-500 to-rose-600',
        'from-cyan-500 to-blue-600',
    ];
    return colors[index % colors.length];
};

export default function TeamAssignmentModal({ user, teams, isOpen, onClose, onSuccess, showToast }) {
    const { currentCompany } = useCompany();
    const [selectedTeams, setSelectedTeams] = useState(new Set());
    const [primaryTeam, setPrimaryTeam] = useState(null);
    const [selectedManager, setSelectedManager] = useState(null);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [activeSection, setActiveSection] = useState('teams');
    const [managerSearch, setManagerSearch] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            loadUserData();
        }
    }, [isOpen, user]);

    const loadUserData = async () => {
        try {
            setInitializing(true);

            const { data: managersData, error: managersError } = await supabase
                .from('users')
                .select('id, name, avatar_url, role')
                .eq('company_id', currentCompany?.id)
                .in('role', ['admin', 'manager'])
                .order('name');

            if (managersError) throw managersError;
            setManagers(managersData || []);

            const { data: teamMemberships, error } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id);

            if (error) throw error;

            const teamIds = new Set(teamMemberships?.map(tm => tm.team_id) || []);
            setSelectedTeams(teamIds);
            setPrimaryTeam(user.teams?.id || user.team_id || null);
            setSelectedManager(user.manager?.id || user.manager_id || null);
        } catch (error) {
            console.error('Error loading user data:', error);
            showToast?.('error', 'Failed to load data', error.message);
        } finally {
            setInitializing(false);
        }
    };

    const toggleTeam = (teamId) => {
        const newSelected = new Set(selectedTeams);
        if (newSelected.has(teamId)) {
            newSelected.delete(teamId);
            if (primaryTeam === teamId) setPrimaryTeam(null);
        } else {
            newSelected.add(teamId);
        }
        setSelectedTeams(newSelected);
    };

    const handleSetPrimary = (teamId) => {
        if (!selectedTeams.has(teamId)) {
            setSelectedTeams(new Set([...selectedTeams, teamId]));
        }
        setPrimaryTeam(teamId);
    };

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(managerSearch.toLowerCase()) &&
        m.id !== user.id
    );

    const currentManager = managers.find(m => m.id === selectedManager);

    const handleSave = async () => {
        try {
            setLoading(true);

            await supabase.from('team_members').delete().eq('user_id', user.id);

            if (selectedTeams.size > 0) {
                const teamAssignments = Array.from(selectedTeams).map(teamId => ({
                    user_id: user.id,
                    team_id: teamId,
                    role: 'member'
                }));
                await supabase.from('team_members').insert(teamAssignments);
            }

            await supabase
                .from('users')
                .update({ team_id: primaryTeam, manager_id: selectedManager })
                .eq('id', user.id);

            onSuccess?.();
        } catch (error) {
            console.error('Error saving:', error);
            showToast?.('error', 'Failed to save', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Use Portal to render modal at document body level
    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 overflow-hidden flex items-center justify-center p-4"
                    style={{ zIndex: 99999 }}
                >
                    {/* Full-screen blur backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/40 dark:border-slate-800/50 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative top gradient */}
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 dark:opacity-30 blur-2xl -translate-y-20" />

                        {/* Header */}
                        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 relative z-10">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl">
                                                {user.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg z-20">
                                        <FiUserCheck className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{user.name}</h2>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">{user.role} • {user.email}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 transition-all active:scale-90"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Section Tabs */}
                        <div className="relative px-8 pt-6 pb-2">
                            <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <button
                                    onClick={() => setActiveSection('teams')}
                                    className={`flex-1 flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeSection === 'teams'
                                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xl ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'
                                        }`}
                                >
                                    <FiLayers className="w-4 h-4" />
                                    Workspaces
                                    {selectedTeams.size > 0 && (
                                        <span className="px-2 py-0.5 bg-indigo-500 text-white rounded-lg text-[10px] font-black">
                                            {selectedTeams.size}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveSection('manager')}
                                    className={`flex-1 flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeSection === 'manager'
                                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xl ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'
                                        }`}
                                >
                                    <FiBriefcase className="w-4 h-4" />
                                    Governance
                                    {selectedManager && (
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {initializing ? (
                                <div className="space-y-4 py-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-24 bg-gray-50/50 dark:bg-slate-800/50 rounded-[2rem] animate-pulse" />
                                    ))}
                                </div>
                            ) : activeSection === 'teams' ? (
                                <div className="space-y-4 py-6">
                                    {teams.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                                <FiLayers className="w-10 h-10 text-gray-300 dark:text-slate-700" />
                                            </div>
                                            <p className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">No spectral teams found</p>
                                        </div>
                                    ) : (
                                        teams.map((team, index) => {
                                            const isSelected = selectedTeams.has(team.id);
                                            const isPrimary = primaryTeam === team.id;

                                            return (
                                                <motion.div
                                                    key={team.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => toggleTeam(team.id)}
                                                    className={`group relative p-5 rounded-[2.5rem] cursor-pointer transition-all duration-500 border-2 ${isPrimary
                                                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 dark:border-amber-500/40 shadow-xl shadow-amber-500/5'
                                                        : isSelected
                                                            ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/30 dark:border-indigo-500/40 shadow-xl shadow-indigo-500/5'
                                                            : 'bg-white/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTeamColor(index)} flex items-center justify-center text-white font-black text-xl shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                                            {team.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-3">
                                                                {team.name}
                                                                {isPrimary && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                                                                        <FiStar className="w-3 h-3 fill-current" />
                                                                        Primary
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isSelected && !isPrimary && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSetPrimary(team.id);
                                                                    }}
                                                                    className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 uppercase tracking-widest mt-1.5 transition-colors"
                                                                >
                                                                    Designate as Primary
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-xl border-3 flex items-center justify-center transition-all duration-500 ${isSelected
                                                            ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/30'
                                                            : 'bg-white/50 dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                                                            }`}>
                                                            {isSelected && <FiCheck className="w-5 h-5 text-white" />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 py-6">
                                    {/* Current Manager */}
                                    {currentManager && (
                                        <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-500/20 dark:border-emerald-500/30 rounded-[2.5rem] shadow-xl shadow-emerald-500/5">
                                            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 ml-1">Active Oversight</div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-xl shadow-emerald-500/20 ring-4 ring-white dark:ring-slate-900">
                                                        {currentManager.avatar_url ? (
                                                            <img src={currentManager.avatar_url} alt={currentManager.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            currentManager.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 dark:text-white text-lg tracking-tight">{currentManager.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{currentManager.role}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedManager(null)}
                                                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Search */}
                                    <div className="relative group">
                                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Audit management structure..."
                                            value={managerSearch}
                                            onChange={(e) => setManagerSearch(e.target.value)}
                                            className="w-full pl-14 pr-4 py-4.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-bold text-sm"
                                        />
                                    </div>

                                    {/* Manager List */}
                                    <div className="space-y-3">
                                        {filteredManagers.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">No authority found</p>
                                            </div>
                                        ) : (
                                            filteredManagers.map((manager) => (
                                                <button
                                                    key={manager.id}
                                                    onClick={() => setSelectedManager(manager.id)}
                                                    className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 text-left group/mgr ${selectedManager === manager.id
                                                        ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-2 border-indigo-500/30 shadow-xl'
                                                        : 'bg-white/50 dark:bg-slate-900/50 border-2 border-gray-100 dark:border-slate-800 hover:border-indigo-500/20'
                                                        }`}
                                                >
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-black shadow-lg overflow-hidden transition-transform duration-500 group-hover/mgr:scale-110">
                                                            {manager.avatar_url ? (
                                                                <img src={manager.avatar_url} alt={manager.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                manager.name.charAt(0)
                                                            )}
                                                        </div>
                                                        {selectedManager === manager.id && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                                                                <FiCheck className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{manager.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{manager.role}</div>
                                                    </div>
                                                    {selectedManager === manager.id && (
                                                        <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                        {selectedTeams.size} Assignments
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3.5 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
                                >
                                    Discard
                                </button>
                                <motion.button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-10 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:shadow-indigo-500/10 transition-all disabled:opacity-50 flex items-center gap-3"
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-3 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
                                    ) : (
                                        'Synchronize'
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
