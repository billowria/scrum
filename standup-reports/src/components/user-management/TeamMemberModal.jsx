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
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-white/40 dark:border-slate-800/50 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100 dark:border-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                                        <FiUsers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                            Manage Roster
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                                {team.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-gray-400 dark:text-slate-500"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="px-8 py-5 bg-gray-50/50 dark:bg-slate-800/20 border-b border-gray-100 dark:border-slate-800/50">
                            <div className="relative group">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search collaborators by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-300 dark:placeholder:text-slate-600 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="h-20 bg-gray-100/50 dark:bg-slate-800/50 rounded-2xl animate-pulse border border-gray-50 dark:border-slate-800" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredUsers.map((user) => {
                                        const isMember = teamMembers.has(user.id);
                                        return (
                                            <motion.div
                                                key={user.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`group flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-300 ${isMember
                                                    ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/30'
                                                    : 'bg-white/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-lg'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isMember ? 'from-indigo-500 to-purple-500' : 'from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-750'} flex items-center justify-center text-white font-bold shadow-md overflow-hidden ring-2 ring-white/50 dark:ring-slate-800/50`}>
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className={isMember ? 'text-white' : 'text-gray-400 dark:text-slate-500'}>
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isMember && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                                                                <FiCheck className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{user.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{user.email}</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleMember(user.id)}
                                                    disabled={saving}
                                                    className={`p-3 rounded-xl transition-all duration-300 transform active:scale-95 ${isMember
                                                        ? 'text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20'
                                                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/10'
                                                        }`}
                                                    title={isMember ? 'Revoke Access' : 'Grant Access'}
                                                >
                                                    {isMember ? <FiUserMinus className="w-6 h-6" /> : <FiUserPlus className="w-6 h-6" />}
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                        {teamMembers.size} {teamMembers.size === 1 ? 'Collaborator' : 'Collaborators'}
                                    </span>
                                </div>
                            </div>
                            <motion.button
                                onClick={() => {
                                    onSuccess();
                                    onClose();
                                }}
                                className="px-10 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl hover:shadow-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Finalize
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
