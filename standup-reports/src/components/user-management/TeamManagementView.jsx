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
                    <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 animate-pulse h-48" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/60 backdrop-blur-xl p-4 rounded-xl border border-white/30 shadow-sm">
                <div className="relative w-full">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
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
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-md hover:shadow-xl transition-all duration-300"
                                whileHover={{ y: -4 }}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                                            style={{ backgroundColor: color }}
                                        >
                                            {team.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
                                            <p className="text-sm text-gray-500">{members.length} members</p>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative">
                                        <motion.button
                                            onClick={() => setShowActionsMenu(showActionsMenu === team.id ? null : team.id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <FiMoreVertical className="w-5 h-5" />
                                        </motion.button>

                                        <AnimatePresence>
                                            {showActionsMenu === team.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTeam(team);
                                                            setShowCreateModal(true);
                                                            setShowActionsMenu(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                        Edit Team
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeam(team.id, team.name)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                        Delete Team
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Members Preview */}
                                <div className="mb-6">
                                    <div className="flex items-center -space-x-2 overflow-hidden py-1">
                                        {members.slice(0, 5).map((member, i) => (
                                            <div
                                                key={i}
                                                className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden"
                                                title={member.name}
                                            >
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        ))}
                                        {members.length > 5 && (
                                            <div className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                +{members.length - 5}
                                            </div>
                                        )}
                                        {members.length === 0 && (
                                            <span className="text-sm text-gray-400 italic">No members assigned</span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <motion.button
                                    onClick={() => {
                                        setSelectedTeam(team);
                                        setShowMemberModal(true);
                                    }}
                                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiUserPlus className="w-4 h-4" />
                                    Manage Members
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
