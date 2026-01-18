import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMail, FiShield, FiUsers, FiMoreVertical, FiEdit2, FiTrash2,
    FiUserCheck, FiStar, FiClock, FiChevronDown, FiCheck, FiX, FiLink
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';
import TeamAssignmentModal from './TeamAssignmentModal';

const getRoleConfig = (role) => {
    switch (role) {
        case 'admin':
            return {
                color: 'from-rose-500 to-red-600',
                bg: 'bg-rose-500/10',
                text: 'text-rose-600 dark:text-rose-400',
                border: 'border-rose-200/50 dark:border-rose-500/30'
            };
        case 'manager':
            return {
                color: 'from-indigo-500 to-blue-600',
                bg: 'bg-indigo-500/10',
                text: 'text-indigo-600 dark:text-indigo-400',
                border: 'border-indigo-200/50 dark:border-indigo-500/30'
            };
        default:
            return {
                color: 'from-slate-500 to-gray-600',
                bg: 'bg-slate-500/10',
                text: 'text-slate-600 dark:text-slate-400',
                border: 'border-slate-200/50 dark:border-slate-500/30'
            };
    }
};

const getTeamColor = (index) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
};

export default function UserCardView({ users, teams, loading, onRefresh, showToast }) {
    const { currentCompany } = useCompany();
    const [hoveredCard, setHoveredCard] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [managers, setManagers] = useState([]);

    const [editingField, setEditingField] = useState(null); // { userId, field: 'team' | 'manager' }
    const [saving, setSaving] = useState(null);

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
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
            showToast('success', 'User deleted', `${userName} has been removed successfully`);
            onRefresh();
        } catch (error) {
            showToast('error', 'Delete failed', error.message);
        }
    };

    const handleUpdateField = async (userId, field, value) => {
        setSaving(userId);
        try {
            const updates = {};
            if (field === 'team') updates.team_id = value;
            if (field === 'manager') updates.manager_id = value;

            const { error } = await supabase.from('users').update(updates).eq('id', userId);
            if (error) throw error;

            if (field === 'team') {
                await supabase.from('team_members').delete().eq('user_id', userId);
                if (value) {
                    await supabase.from('team_members').insert({ user_id: userId, team_id: value, role: 'member' });
                }
            }

            showToast('success', `${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
            onRefresh();
        } catch (error) {
            showToast('error', `Failed to update ${field}`, error.message);
        } finally {
            setSaving(null);
            setEditingField(null);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-48 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-slate-800/50 animate-pulse" />
                ))}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-16 text-center border border-white/40 dark:border-slate-800/50 shadow-2xl"
            >
                <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                    <FiUsers className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No members found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">We couldn't find any users matching your criteria. Try adjusting your filters.</p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user, index) => {
                const role = getRoleConfig(user.role);
                const isHovered = hoveredCard === user.id;

                return (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onMouseEnter={() => setHoveredCard(user.id)}
                        onMouseLeave={() => {
                            setHoveredCard(null);
                            setShowActionsMenu(null);
                        }}
                        className="group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white/50 dark:border-slate-800/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
                    >
                        {/* Compact Gradient Badge (Role) */}
                        <div className={`absolute top-0 right-0 px-3 py-1 bg-gradient-to-l ${role.color} text-[9px] font-black text-white uppercase tracking-[0.15em] rounded-bl-xl shadow-lg z-10 opacity-90`}>
                            {user.role}
                        </div>

                        {/* Top Info Section: Avatar, Name, Role */}
                        <div className="flex gap-4 items-center mb-4">
                            <div className="relative shrink-0">
                                <motion.div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} p-[2px] shadow-lg ring-4 ring-white/30 dark:ring-black/20`}
                                    animate={isHovered ? { scale: 1.05, rotate: [0, -3, 3, 0] } : {}}
                                >
                                    <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center font-bold text-lg text-slate-700 dark:text-white">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            user.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-md" />
                                </motion.div>
                            </div>

                            <div className="min-w-0 pr-10">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate tracking-tight mb-0.5">
                                    {user.name}
                                </h3>
                                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                                    <FiMail className="w-3 h-3" />
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Metadata Grid: Compact and Modern */}
                        <div className="grid grid-cols-1 gap-2 mb-4">
                            {/* Team Tag */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Assignment</span>
                                <div
                                    onClick={() => setEditingField({ userId: user.id, field: 'team' })}
                                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group/item"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTeamColor(0) }} />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                            {user.primaryTeam?.name || user.teams?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                    <FiChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-indigo-500 transition-colors" />
                                </div>
                            </div>

                            {/* Manager Tag */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Reports To</span>
                                <div
                                    onClick={() => setEditingField({ userId: user.id, field: 'manager' })}
                                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group/item"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FiUserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                            {user.manager?.name || 'No Direct Manager'}
                                        </span>
                                    </div>
                                    <FiChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Action Bar: Modern Floating Buttons */}
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                <FiClock className="w-3 h-3 text-slate-300" />
                                {new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => { setSelectedUser(user); setShowTeamModal(true); }}
                                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                                    title="Manage Teams"
                                >
                                    <FiUsers className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowActionsMenu(user.id)}
                                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    <FiMoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Floating Actions Menu */}
                        <AnimatePresence>
                            {showActionsMenu === user.id && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-12 right-4 w-48 bg-white dark:bg-slate-900 shadow-2xl rounded-xl border border-slate-100 dark:border-slate-800 py-2 z-20"
                                >
                                    <button className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                                        <FiEdit2 className="w-3.5 h-3.5" /> Edit Profile
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                                        <FiLink className="w-3.5 h-3.5" /> Copy Profile Link
                                    </button>
                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                    <button
                                        onClick={() => handleDelete(user.id, user.name)}
                                        className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" /> Delete Member
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Inline Editors */}
                        <AnimatePresence>
                            {editingField?.userId === user.id && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 p-4 flex flex-col justify-center"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            Change {editingField.field}
                                        </h4>
                                        <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
                                    </div>

                                    {editingField.field === 'team' ? (
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                                            <button
                                                onClick={() => handleUpdateField(user.id, 'team', null)}
                                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200"
                                            >
                                                No Team (Clear)
                                            </button>
                                            {teams.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => handleUpdateField(user.id, 'team', t.id)}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-100 flex items-center gap-2"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                                            <button
                                                onClick={() => handleUpdateField(user.id, 'manager', null)}
                                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200"
                                            >
                                                No Manager (Clear)
                                            </button>
                                            {managers.filter(m => m.id !== user.id).map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => handleUpdateField(user.id, 'manager', m.id)}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-100 flex items-center gap-2"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {saving === user.id && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {selectedUser && (
                <TeamAssignmentModal
                    user={selectedUser}
                    teams={teams}
                    isOpen={showTeamModal}
                    onClose={() => { setShowTeamModal(false); setSelectedUser(null); }}
                    onSuccess={() => {
                        showToast('success', 'Assignments updated');
                        onRefresh();
                        setShowTeamModal(false);
                        setSelectedUser(null);
                    }}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
