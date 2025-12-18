import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiMail, FiShield, FiUsers, FiEdit2, FiTrash2, FiUserCheck, FiStar
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import TeamAssignmentModal from './TeamAssignmentModal';

const getRoleBadgeColor = (role) => {
    switch (role) {
        case 'admin':
            return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30';
        case 'manager':
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
        default:
            return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
    }
};

const getTeamColor = (index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 65%, 50%)`;
};

export default function UserTableView({ users, teams, loading, onRefresh, showToast }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const sortedUsers = [...users].sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === 'name' || sortBy === 'email') {
            aVal = aVal?.toLowerCase() || '';
            bVal = bVal?.toLowerCase() || '';
        }

        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

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
    };

    if (loading) {
        return (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/40 dark:border-slate-800/50 overflow-hidden shadow-xl">
                <div className="p-8 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                    ))}
                </div>
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-slate-800/50 shadow-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-800/80">
                                <th
                                    onClick={() => handleSort('name')}
                                    className="px-6 py-5 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        User
                                        {sortBy === 'name' && (
                                            <span className="text-indigo-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('email')}
                                    className="px-6 py-5 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        Email
                                        {sortBy === 'email' && (
                                            <span className="text-indigo-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('role')}
                                    className="px-6 py-5 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        Role
                                        {sortBy === 'role' && (
                                            <span className="text-indigo-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                    Primary Team
                                </th>
                                <th className="px-6 py-5 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {sortedUsers.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    {/* User */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${index % 2 === 0 ? 'from-indigo-500 to-purple-500' : 'from-blue-500 to-indigo-500'} flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden ring-2 ring-white/50 dark:ring-slate-800/50`}
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name?.charAt(0).toUpperCase()
                                                )}
                                            </motion.div>
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{user.name}</div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-500 dark:text-slate-400">{user.email}</div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getRoleBadgeColor(user.role)}`}>
                                            <FiShield className="w-3 h-3" />
                                            {user.role}
                                        </span>
                                    </td>

                                    {/* Team */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.primaryTeam || user.teams ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl w-fit shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{user.primaryTeam?.name || user.teams?.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 dark:text-slate-500 italic font-medium">No team</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                            <motion.button
                                                onClick={() => openTeamModal(user)}
                                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors shadow-sm bg-white dark:bg-slate-800"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <FiUsers className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(user.id, user.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shadow-sm bg-white dark:bg-slate-800"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

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
                        showToast('success', 'Teams updated', `Teams for ${selectedUser.name} have been updated`);
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
