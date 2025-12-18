import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMail, FiShield, FiUsers, FiMoreVertical, FiEdit2, FiTrash2,
    FiUserCheck, FiStar, FiClock, FiChevronDown, FiCheck, FiX
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';
import TeamAssignmentModal from './TeamAssignmentModal';

const getRoleColor = (role) => {
    switch (role) {
        case 'admin':
            return 'from-red-500 to-pink-600';
        case 'manager':
            return 'from-blue-500 to-indigo-600';
        default:
            return 'from-gray-500 to-slate-600';
    }
};

const getRoleBadgeColor = (role) => {
    switch (role) {
        case 'admin':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'manager':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getTeamColor = (index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 65%, 50%)`;
};

export default function UserCardView({ users, teams, loading, onRefresh, showToast }) {
    const { currentCompany } = useCompany();
    const [hoveredCard, setHoveredCard] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [managers, setManagers] = useState([]);

    // Inline edit states
    const [editingTeam, setEditingTeam] = useState(null);
    const [editingManager, setEditingManager] = useState(null);
    const [savingTeam, setSavingTeam] = useState(null);
    const [savingManager, setSavingManager] = useState(null);

    // Fetch managers on mount
    useEffect(() => {
        if (currentCompany?.id) {
            fetchManagers();
        }
    }, [currentCompany]);

    const fetchManagers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, avatar_url, role')
                .eq('company_id', currentCompany?.id)
                .in('role', ['admin', 'manager'])
                .order('name');

            if (error) throw error;
            setManagers(data || []);
        } catch (error) {
            console.error('Error fetching managers:', error);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            showToast('success', 'User deleted', `${userName} has been removed successfully`);
            onRefresh();
        } catch (error) {
            showToast('error', 'Delete failed', error.message);
        }
    };

    const openTeamModal = (user) => {
        setSelectedUser(user);
        setShowTeamModal(true);
        setShowActionsMenu(null);
    };

    // Inline team assignment
    const handleInlineTeamChange = async (userId, teamId) => {
        setSavingTeam(userId);
        try {
            // Update primary team
            const { error: userError } = await supabase
                .from('users')
                .update({ team_id: teamId || null })
                .eq('id', userId);

            if (userError) throw userError;

            // Also update team_members table
            await supabase.from('team_members').delete().eq('user_id', userId);

            if (teamId) {
                await supabase.from('team_members').insert({
                    user_id: userId,
                    team_id: teamId,
                    role: 'member'
                });
            }

            showToast('success', 'Team updated');
            onRefresh();
        } catch (error) {
            showToast('error', 'Failed to update team', error.message);
        } finally {
            setSavingTeam(null);
            setEditingTeam(null);
        }
    };

    // Inline manager assignment
    const handleInlineManagerChange = async (userId, managerId) => {
        setSavingManager(userId);
        try {
            const { error } = await supabase
                .from('users')
                .update({ manager_id: managerId || null })
                .eq('id', userId);

            if (error) throw error;

            showToast('success', 'Manager updated');
            onRefresh();
        } catch (error) {
            showToast('error', 'Failed to update manager', error.message);
        } finally {
            setSavingManager(null);
            setEditingManager(null);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/40 dark:border-slate-800/50 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-lg w-3/4" />
                                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/2" />
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="h-10 bg-gray-100 dark:bg-slate-800/50 rounded-xl w-full" />
                            <div className="h-10 bg-gray-100 dark:bg-slate-800/50 rounded-xl w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-12 text-center border border-white/40 dark:border-slate-800/50 shadow-xl"
            >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-750 rounded-3xl flex items-center justify-center shadow-inner">
                    <FiUsers className="w-12 h-12 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No users found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
            </motion.div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user, index) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onMouseEnter={() => setHoveredCard(user.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/50 dark:border-slate-800/50 shadow-lg hover:shadow-2xl transition-all duration-500"
                        whileHover={{ y: -6, scale: 1.02 }}
                    >
                        {/* Status Decoration */}
                        <div className="absolute top-0 right-12 w-12 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Header: Avatar & Quick Actions */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <motion.div
                                    className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/5 overflow-hidden ring-4 ring-white/50 dark:ring-slate-800/50`}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;
                                            }}
                                        />
                                    ) : (
                                        user.name?.charAt(0).toUpperCase()
                                    )}
                                    {/* Active Status Indicator */}
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5 animate-pulse" />
                                    </div>
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate tracking-tight">{user.name}</h3>
                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-1 font-medium">
                                        <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate opacity-80">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Menu */}
                            <div className="relative">
                                <motion.button
                                    onClick={() => setShowActionsMenu(showActionsMenu === user.id ? null : user.id)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all duration-300"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <FiMoreVertical className="w-5 h-5" />
                                </motion.button>

                                <AnimatePresence>
                                    {showActionsMenu === user.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
                                            className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-30"
                                        >
                                            <button
                                                onClick={() => openTeamModal(user)}
                                                className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 transition-colors"
                                            >
                                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                                                    <FiUsers className="w-4 h-4" />
                                                </div>
                                                Manage Assignments
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // TODO: Implement edit
                                                    setShowActionsMenu(null);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors"
                                            >
                                                <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                                                    <FiEdit2 className="w-4 h-4" />
                                                </div>
                                                Edit User Profile
                                            </button>
                                            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                                            <button
                                                onClick={() => handleDelete(user.id, user.name)}
                                                className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                            >
                                                <div className="p-1.5 bg-red-100 dark:bg-red-500/20 rounded-lg">
                                                    <FiTrash2 className="w-4 h-4" />
                                                </div>
                                                Delete Member
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getRoleBadgeColor(user.role)} dark:bg-opacity-20 dark:border-opacity-30`}>
                                <FiShield className="w-3.5 h-3.5" />
                                {user.role}
                            </span>

                            {user.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-500/30 shadow-sm">
                                    <FiStar className="w-3 h-3" />
                                    Super Admin
                                </span>
                            )}
                        </div>

                        {/* Teams - Inline Editable */}
                        <div className="mb-5 p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800/50 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Primary Team</div>
                                {editingTeam !== user.id && (
                                    <button
                                        onClick={() => setEditingTeam(user.id)}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {editingTeam === user.id ? (
                                <div className="relative group/select">
                                    <select
                                        defaultValue={user.primaryTeam?.id || user.teams?.id || ''}
                                        onChange={(e) => handleInlineTeamChange(user.id, e.target.value || null)}
                                        disabled={savingTeam === user.id}
                                        className="w-full px-3 py-2.5 pr-8 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none transition-all"
                                    >
                                        <option value="">No Team Assigned</option>
                                        {teams.map((team, idx) => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within/select:text-indigo-500 transition-colors" />
                                    <button
                                        onClick={() => setEditingTeam(null)}
                                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {user.assignedTeams && user.assignedTeams.length > 0 ? (
                                        <>
                                            {user.assignedTeams.slice(0, 2).map((team, idx) => (
                                                <span
                                                    key={team?.id || idx}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-xs font-bold shadow-sm"
                                                    style={{
                                                        color: getTeamColor(idx)
                                                    }}
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: getTeamColor(idx) }}
                                                    />
                                                    {team?.name || 'Unknown'}
                                                </span>
                                            ))}
                                            {user.assignedTeams.length > 2 && (
                                                <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold">
                                                    +{user.assignedTeams.length - 2} more
                                                </span>
                                            )}
                                        </>
                                    ) : user.primaryTeam || user.teams ? (
                                        <span
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-xs font-bold shadow-sm"
                                            style={{
                                                color: getTeamColor(0)
                                            }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: getTeamColor(0) }}
                                            />
                                            {user.primaryTeam?.name || user.teams?.name}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 dark:text-slate-500 italic font-medium">No team assigned yet</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manager - Inline Editable */}
                        <div className="mb-6 p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800/50 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Reporting To</div>
                                {editingManager !== user.id && (
                                    <button
                                        onClick={() => setEditingManager(user.id)}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {editingManager === user.id ? (
                                <div className="relative group/select">
                                    <select
                                        defaultValue={user.manager?.id || ''}
                                        onChange={(e) => handleInlineManagerChange(user.id, e.target.value || null)}
                                        disabled={savingManager === user.id}
                                        className="w-full px-3 py-2.5 pr-8 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none transition-all"
                                    >
                                        <option value="">No Direct Manager</option>
                                        {managers.filter(m => m.id !== user.id).map((manager) => (
                                            <option key={manager.id} value={manager.id}>{manager.name}</option>
                                        ))}
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within/select:text-indigo-500 transition-colors" />
                                    <button
                                        onClick={() => setEditingManager(null)}
                                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : user.manager ? (
                                <div className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 rounded-xl shadow-sm">
                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg">
                                        <FiUserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{user.manager.name}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 dark:text-slate-500 italic font-medium">No manager assigned yet</span>
                            )}
                        </div>

                        {/* Footer: Created At */}
                        <div className="pt-5 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
                            <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                <FiClock className="w-3.5 h-3.5" />
                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* Quick Action on Hover */}
                            <AnimatePresence>
                                {hoveredCard === user.id && (
                                    <motion.button
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        onClick={() => openTeamModal(user)}
                                        className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-1 uppercase tracking-widest"
                                    >
                                        Assignments
                                        <FiChevronDown className="w-3.5 h-3.5 -rotate-90" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Team Assignment Modal */}
            {selectedUser && (
                <TeamAssignmentModal
                    user={selectedUser}
                    teams={teams}
                    isOpen={showTeamModal}
                    onClose={() => {
                        setShowTeamModal(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        showToast('success', 'Assignments updated', `Assignments for ${selectedUser.name} have been updated`);
                        onRefresh();
                        setShowTeamModal(false);
                        setSelectedUser(null);
                    }}
                    showToast={showToast}
                />
            )}
        </>
    );
}
