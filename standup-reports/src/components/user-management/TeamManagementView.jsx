import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiUserPlus, FiSearch, FiLayers, FiSettings } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import CreateTeamModal from './CreateTeamModal';
import TeamMemberModal from './TeamMemberModal';

const getTeamColor = (index) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-44 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-slate-800/50 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Minimal Search Bar */}
            <div className="flex bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-white/40 dark:border-slate-800/50 shadow-sm">
                <div className="relative w-full group/search">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Quick search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white transition-all font-medium placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Teams Grid - Compact Version */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                    {filteredTeams.map((team, index) => {
                        const members = teamMembers[team.id] || [];
                        const color = getTeamColor(index);

                        return (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: index * 0.03 }}
                                onMouseLeave={() => setShowActionsMenu(null)}
                                className="group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white/50 dark:border-slate-800/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
                            >
                                {/* Color accent bar */}
                                <div className="absolute top-0 left-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: color }} />

                                {/* Header: Team Info */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                                            style={{ backgroundColor: color }}
                                        >
                                            {team.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate tracking-tight mb-0.5">{team.name}</h3>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{members.length} Members</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowActionsMenu(showActionsMenu === team.id ? null : team.id)}
                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                        >
                                            <FiMoreVertical className="w-4 h-4" />
                                        </button>

                                        <AnimatePresence>
                                            {showActionsMenu === team.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                                    className="absolute right-0 top-6 w-40 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-100 dark:border-slate-800 py-1.5 z-20"
                                                >
                                                    <button
                                                        onClick={() => { setSelectedTeam(team); setShowCreateModal(true); setShowActionsMenu(null); }}
                                                        className="w-full px-3 py-1.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                    >
                                                        <FiEdit2 className="w-3.5 h-3.5" /> Rename
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeam(team.id, team.name)}
                                                        className="w-full px-3 py-1.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                                                    >
                                                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Member Preview Stack */}
                                <div className="mb-4">
                                    <div className="flex items-center -space-x-2 overflow-hidden py-1">
                                        {members.slice(0, 4).map((member, i) => (
                                            <div
                                                key={i}
                                                className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shadow-sm"
                                                title={member.name}
                                            >
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        ))}
                                        {members.length > 4 && (
                                            <div className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-900 bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-[9px] font-black text-indigo-600 dark:text-indigo-400 shadow-sm">
                                                +{members.length - 4}
                                            </div>
                                        )}
                                        {members.length === 0 && (
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium px-1">Emply workspace</span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                    <button
                                        onClick={() => { setSelectedTeam(team); setShowMemberModal(true); }}
                                        className="w-full py-2 px-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all duration-300 border border-transparent hover:border-indigo-100/50 dark:hover:border-indigo-500/30"
                                    >
                                        <FiSettings className="w-3 h-3" />
                                        Manage Members
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Modals - Unchanged */}
            <CreateTeamModal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); setSelectedTeam(null); }}
                team={selectedTeam}
                onSuccess={() => { onRefresh(); setShowCreateModal(false); setSelectedTeam(null); showToast('success', selectedTeam ? 'Team updated' : 'Team created'); }}
                showToast={showToast}
            />

            {selectedTeam && (
                <TeamMemberModal
                    isOpen={showMemberModal}
                    onClose={() => { setShowMemberModal(false); setSelectedTeam(null); }}
                    team={selectedTeam}
                    onSuccess={() => { fetchTeamMembers(); showToast('success', 'Members updated'); }}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
