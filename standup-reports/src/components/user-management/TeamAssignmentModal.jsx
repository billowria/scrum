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
            <div
                className="fixed inset-0 overflow-hidden"
                style={{ zIndex: 99999 }}
            >
                {/* Full-screen blur backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    style={{ zIndex: 99999 }}
                />

                {/* Modal Container - Centered */}
                <div
                    className="absolute inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: 100000 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative top gradient */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />

                        {/* Header */}
                        <div className="relative px-6 pt-6 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                            {user.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                    <p className="text-white/80 text-sm">{user.email}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Section Tabs */}
                        <div className="relative px-6 pb-4">
                            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                                <button
                                    onClick={() => setActiveSection('teams')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeSection === 'teams'
                                            ? 'bg-white text-gray-900 shadow-md'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <FiLayers className="w-4 h-4" />
                                    Teams
                                    {selectedTeams.size > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                            {selectedTeams.size}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveSection('manager')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeSection === 'manager'
                                            ? 'bg-white text-gray-900 shadow-md'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <FiBriefcase className="w-4 h-4" />
                                    Manager
                                    {selectedManager && (
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-4 max-h-[50vh] overflow-y-auto">
                            {initializing ? (
                                <div className="space-y-3 py-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : activeSection === 'teams' ? (
                                <div className="space-y-3 py-2">
                                    {teams.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <FiLayers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No teams available</p>
                                        </div>
                                    ) : (
                                        teams.map((team, index) => {
                                            const isSelected = selectedTeams.has(team.id);
                                            const isPrimary = primaryTeam === team.id;

                                            return (
                                                <motion.div
                                                    key={team.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    onClick={() => toggleTeam(team.id)}
                                                    className={`relative p-4 rounded-2xl cursor-pointer transition-all border-2 ${isPrimary
                                                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 shadow-md'
                                                            : isSelected
                                                                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-sm'
                                                                : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTeamColor(index)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                                            {team.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                                {team.name}
                                                                {isPrimary && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-xs font-bold">
                                                                        <FiStar className="w-3 h-3" />
                                                                        Primary
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isSelected && !isPrimary && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSetPrimary(team.id);
                                                                    }}
                                                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-0.5"
                                                                >
                                                                    Set as primary
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'bg-white border-gray-300'
                                                            }`}>
                                                            {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 py-2">
                                    {/* Current Manager */}
                                    {currentManager && (
                                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
                                            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Current Manager</div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
                                                        {currentManager.avatar_url ? (
                                                            <img src={currentManager.avatar_url} alt={currentManager.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            currentManager.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{currentManager.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{currentManager.role}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedManager(null)}
                                                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Search */}
                                    <div className="relative">
                                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search managers..."
                                            value={managerSearch}
                                            onChange={(e) => setManagerSearch(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-indigo-300 transition-all"
                                        />
                                    </div>

                                    {/* Manager List */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {filteredManagers.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500">
                                                <p>No managers found</p>
                                            </div>
                                        ) : (
                                            filteredManagers.map((manager) => (
                                                <button
                                                    key={manager.id}
                                                    onClick={() => setSelectedManager(manager.id)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedManager === manager.id
                                                            ? 'bg-indigo-100 border-2 border-indigo-300'
                                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                        {manager.avatar_url ? (
                                                            <img src={manager.avatar_url} alt={manager.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            manager.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{manager.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{manager.role}</div>
                                                    </div>
                                                    {selectedManager === manager.id && (
                                                        <FiCheck className="w-5 h-5 text-indigo-600" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                                {selectedManager && <span className="ml-2">• Manager set</span>}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
