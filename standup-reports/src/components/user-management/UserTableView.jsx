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
            return 'bg-red-100 text-red-700';
        case 'manager':
            return 'bg-blue-100 text-blue-700';
        default:
            return 'bg-gray-100 text-gray-700';
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
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden">
                <div className="p-8 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
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
                className="bg-white/60 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/30"
            >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <FiUsers className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No users found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
            </motion.div>
        );
    }

    return (
        <>
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-slate-100 to-gray-100 border-b border-gray-200">
                            <tr>
                                <th
                                    onClick={() => handleSort('name')}
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FiUsers className="w-4 h-4" />
                                        User
                                        {sortBy === 'name' && (
                                            <span className="text-slate-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('email')}
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FiMail className="w-4 h-4" />
                                        Email
                                        {sortBy === 'email' && (
                                            <span className="text-slate-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('role')}
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FiShield className="w-4 h-4" />
                                        Role
                                        {sortBy === 'role' && (
                                            <span className="text-slate-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <FiUsers className="w-4 h-4" />
                                        Teams
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <FiUserCheck className="w-4 h-4" />
                                        Manager
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedUsers.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="hover:bg-indigo-50/50 transition-colors group"
                                >
                                    {/* User */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden"
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
                                                {/* Active indicator */}
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                                            </motion.div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{user.email}</div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                                            <FiShield className="w-3 h-3" />
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>

                                    {/* Teams */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                                            {user.assignedTeams && user.assignedTeams.length > 0 ? (
                                                <>
                                                    {user.assignedTeams.slice(0, 2).map((team, idx) => (
                                                        <span
                                                            key={team?.id || idx}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border rounded text-xs font-medium"
                                                            style={{
                                                                borderColor: getTeamColor(idx),
                                                                color: getTeamColor(idx)
                                                            }}
                                                        >
                                                            <div
                                                                className="w-1.5 h-1.5 rounded-full"
                                                                style={{ backgroundColor: getTeamColor(idx) }}
                                                            />
                                                            {team?.name || 'Unknown'}
                                                        </span>
                                                    ))}
                                                    {user.assignedTeams.length > 2 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                            +{user.assignedTeams.length - 2}
                                                        </span>
                                                    )}
                                                </>
                                            ) : user.primaryTeam ? (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border rounded text-xs font-medium"
                                                    style={{
                                                        borderColor: getTeamColor(0),
                                                        color: getTeamColor(0)
                                                    }}
                                                >
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: getTeamColor(0) }}
                                                    />
                                                    {user.primaryTeam.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No teams</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Manager */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.manager ? (
                                            <span className="text-sm text-gray-700">{user.manager.name}</span>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No manager</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <motion.button
                                                onClick={() => openTeamModal(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Assign Teams"
                                            >
                                                <FiUsers className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => {
                                                    // TODO: Implement edit
                                                }}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Edit User"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(user.id, user.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Delete User"
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
