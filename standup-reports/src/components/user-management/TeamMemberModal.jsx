import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUsers, FiSearch, FiCheck, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useCompany } from '../../contexts/CompanyContext';

export default function TeamMemberModal({ isOpen, onClose, team, onSuccess, showToast }) {
    const { currentCompany } = useCompany();
    const [users, setUsers] = useState([]);
    const [teamMembers, setTeamMembers] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && team) {
            fetchData();
        }
    }, [isOpen, team]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all users
            const { data: allUsers, error: usersError } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .eq('company_id', currentCompany.id)
                .order('name');

            if (usersError) throw usersError;
            setUsers(allUsers || []);

            // Fetch current team members
            const { data: members, error: membersError } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', team.id);

            if (membersError) throw membersError;
            setTeamMembers(new Set(members.map(m => m.user_id)));

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('error', 'Failed to load data', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = async (userId) => {
        try {
            setSaving(true);
            const isMember = teamMembers.has(userId);

            if (isMember) {
                // Remove member
                const { error } = await supabase
                    .from('team_members')
                    .delete()
                    .eq('team_id', team.id)
                    .eq('user_id', userId);

                if (error) throw error;

                const newMembers = new Set(teamMembers);
                newMembers.delete(userId);
                setTeamMembers(newMembers);
            } else {
                // Add member
                const { error } = await supabase
                    .from('team_members')
                    .insert([{ team_id: team.id, user_id: userId }]);

                if (error) throw error;

                const newMembers = new Set(teamMembers);
                newMembers.add(userId);
                setTeamMembers(newMembers);
            }
        } catch (error) {
            showToast('error', 'Update failed', error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FiUsers className="w-5 h-5" />
                                Manage Members
                            </h3>
                            <p className="text-indigo-100 text-sm">{team.name}</p>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.map((user) => {
                                    const isMember = teamMembers.has(user.id);
                                    return (
                                        <motion.div
                                            key={user.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isMember
                                                    ? 'bg-indigo-50 border-indigo-200'
                                                    : 'bg-white border-gray-100 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => toggleMember(user.id)}
                                                disabled={saving}
                                                className={`p-2 rounded-lg transition-colors ${isMember
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-indigo-600 hover:bg-indigo-50'
                                                    }`}
                                                title={isMember ? 'Remove from team' : 'Add to team'}
                                            >
                                                {isMember ? <FiUserMinus className="w-5 h-5" /> : <FiUserPlus className="w-5 h-5" />}
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
                        <span className="text-sm text-gray-600">
                            {teamMembers.size} member{teamMembers.size !== 1 ? 's' : ''} assigned
                        </span>
                        <button
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
