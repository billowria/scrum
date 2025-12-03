import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMail, FiShield, FiUsers, FiMoreVertical, FiEdit2, FiTrash2,
    FiUserCheck, FiStar, FiClock
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
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
    const hue = (index * 137.5) % 360; // Golden angle for color distribution
    return `hsl(${hue}, 65%, 50%)`;
};

export default function UserCardView({ users, teams, loading, onRefresh, showToast }) {
    const [hoveredCard, setHoveredCard] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);

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

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-300 rounded-xl" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-300 rounded w-3/4" />
                                <div className="h-3 bg-gray-300 rounded w-1/2" />
                            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user, index) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onMouseEnter={() => setHoveredCard(user.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-md hover:shadow-xl transition-all duration-300"
                        whileHover={{ y: -4, scale: 1.02 }}
                    >
                        {/* Header: Avatar & Quick Actions */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <motion.div
                                    className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden`}
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
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    </div>
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-lg truncate">{user.name}</h3>
                                    <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-1">
                                        <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Menu */}
                            <div className="relative">
                                <motion.button
                                    onClick={() => setShowActionsMenu(showActionsMenu === user.id ? null : user.id)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <FiMoreVertical className="w-5 h-5" />
                                </motion.button>

                                <AnimatePresence>
                                    {showActionsMenu === user.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20"
                                        >
                                            <button
                                                onClick={() => openTeamModal(user)}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                            >
                                                <FiUsers className="w-4 h-4" />
                                                Assign Teams
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // TODO: Implement edit
                                                    setShowActionsMenu(null);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 flex items-center gap-2"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                                Edit User
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.name)}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                Delete User
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                                <FiShield className="w-3.5 h-3.5" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>

                            {user.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                    <FiStar className="w-3 h-3" />
                                    Super User
                                </span>
                            )}
                        </div>

                        {/* Teams */}
                        <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teams</div>
                            {user.assignedTeams && user.assignedTeams.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {user.assignedTeams.slice(0, 3).map((team, idx) => (
                                        <span
                                            key={team?.id || idx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-lg text-xs font-medium shadow-sm"
                                            style={{
                                                borderColor: getTeamColor(idx),
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
                                    {user.assignedTeams.length > 3 && (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                            +{user.assignedTeams.length - 3} more
                                        </span>
                                    )}
                                </div>
                            ) : user.primaryTeam ? (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-lg text-xs font-medium shadow-sm"
                                    style={{
                                        borderColor: getTeamColor(0),
                                        color: getTeamColor(0)
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: getTeamColor(0) }}
                                    />
                                    {user.primaryTeam.name}
                                </span>
                            ) : (
                                <span className="text-sm text-gray-400 italic">No teams assigned</span>
                            )}
                        </div>

                        {/* Manager */}
                        {user.manager && (
                            <div className="mb-4">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manager</div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                                    <FiUserCheck className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-900">{user.manager.name}</span>
                                </div>
                            </div>
                        )}

                        {/* Footer: Created At */}
                        <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
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
                                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    >
                                        <FiUsers className="w-3.5 h-3.5" />
                                        Manage Teams
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
