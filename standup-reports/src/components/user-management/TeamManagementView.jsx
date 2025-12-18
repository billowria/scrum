import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiUserPlus, FiSearch } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import CreateTeamModal from './CreateTeamModal';
import TeamMemberModal from './TeamMemberModal';

const getTeamColor = (index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 65%, 50%)`;
};

export default function TeamManagementView({ teams, loading, onRefresh, showToast }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [teamMembers, setTeamMembers] = useState({});

    // Fetch member counts and avatars for each team
    useEffect(() => {
        if (teams.length > 0) {
            fetchTeamMembers();
        }
    }, [teams]);

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('team_id, user_id, users(name, avatar_url)');

            if (error) throw error;

            const membersByTeam = {};
            data.forEach(member => {
                if (!membersByTeam[member.team_id]) {
                    membersByTeam[member.team_id] = [];
                }
                membersByTeam[member.team_id].push(member.users);
            });

            setTeamMembers(membersByTeam);
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const handleDeleteTeam = async (teamId, teamName) => {
        if (!confirm(`Are you sure you want to delete ${teamName}? This will remove all member assignments for this team.`)) return;

        try {
            // First delete team members
            const { error: membersError } = await supabase
                .from('team_members')
                .delete()
                .eq('team_id', teamId);

            if (membersError) throw membersError;

            // Then delete team
            const { error: teamError } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (teamError) throw teamError;

            showToast('success', 'Team deleted', `${teamName} has been deleted successfully`);
            onRefresh();
        } catch (error) {
            showToast('error', 'Delete failed', error.message);
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/40 dark:border-slate-800/50 animate-pulse h-56" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search Bar - Teams specific */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2rem] border border-white/40 dark:border-slate-800/50 shadow-xl">
                <div className="relative w-full group/search">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search teams by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-medium"
                    />
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredTeams.map((team, index) => {
                        const members = teamMembers[team.id] || [];
                        const color = getTeamColor(index);

                        return (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-7 border border-white/50 dark:border-slate-800/50 shadow-lg hover:shadow-2xl transition-all duration-500"
                                whileHover={{ y: -6 }}
                            >
                                {/* Glow Effect */}
                                <div
                                    className="absolute -top-12 -right-12 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none rounded-full"
                                    style={{ backgroundColor: color }}
                                />

                                {/* Header */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <motion.div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-black/10 relative overflow-hidden"
                                            style={{ backgroundColor: color }}
                                            whileHover={{ scale: 1.1, rotate: -5 }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                            {team.name.charAt(0).toUpperCase()}
                                        </motion.div>
                                        <div>
                                            <h3 className="font-black text-gray-900 dark:text-white text-xl tracking-tight">{team.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                                                <span className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{members.length} Members</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative">
                                        <motion.button
                                            onClick={() => setShowActionsMenu(showActionsMenu === team.id ? null : team.id)}
                                            className="p-2.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all duration-300"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <FiMoreVertical className="w-6 h-6" />
                                        </motion.button>

                                        <AnimatePresence>
                                            {showActionsMenu === team.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
                                                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
                                                    className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-2 z-30"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTeam(team);
                                                            setShowCreateModal(true);
                                                            setShowActionsMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-3 transition-colors rounded-2xl"
                                                    >
                                                        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </div>
                                                        Edit Workspace
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeam(team.id, team.name)}
                                                        className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors rounded-2xl mt-1"
                                                    >
                                                        <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </div>
                                                        Delete Team
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Members Preview */}
                                <div className="mb-8 p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800/50">
                                    <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Workspace Core</div>
                                    <div className="flex items-center -space-x-3 overflow-hidden">
                                        {members.slice(0, 5).map((member, i) => (
                                            <motion.div
                                                key={i}
                                                className="relative w-10 h-10 rounded-xl border-4 border-white dark:border-slate-900 bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-slate-400 overflow-hidden shadow-md"
                                                whileHover={{ y: -5, scale: 1.1, zIndex: 10 }}
                                                title={member.name}
                                            >
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0).toUpperCase()
                                                )}
                                            </motion.div>
                                        ))}
                                        {members.length > 5 && (
                                            <div className="relative w-10 h-10 rounded-xl border-4 border-white dark:border-slate-900 bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shadow-md">
                                                +{members.length - 5}
                                            </div>
                                        )}
                                        {members.length === 0 && (
                                            <span className="text-xs text-gray-400 dark:text-slate-500 italic font-medium">Be the first to join</span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <motion.button
                                    onClick={() => {
                                        setSelectedTeam(team);
                                        setShowMemberModal(true);
                                    }}
                                    className="w-full py-4 bg-white/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 border border-gray-100 dark:border-slate-700/50 shadow-sm"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiUserPlus className="w-4 h-4" />
                                    Configure Members
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <CreateTeamModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setSelectedTeam(null);
                }}
                team={selectedTeam}
                onSuccess={() => {
                    onRefresh();
                    setShowCreateModal(false);
                    setSelectedTeam(null);
                    showToast('success', selectedTeam ? 'Team updated' : 'Team created');
                }}
                showToast={showToast}
            />

            {selectedTeam && (
                <TeamMemberModal
                    isOpen={showMemberModal}
                    onClose={() => {
                        setShowMemberModal(false);
                        setSelectedTeam(null);
                    }}
                    team={selectedTeam}
                    onSuccess={() => {
                        fetchTeamMembers(); // Refresh member counts
                        showToast('success', 'Members updated');
                    }}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
