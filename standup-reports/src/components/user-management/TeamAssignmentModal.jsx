import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiUsers, FiStar } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

const getTeamColor = (index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 65%, 50%)`;
};

export default function TeamAssignmentModal({ user, teams, isOpen, onClose, onSuccess, showToast }) {
    const [selectedTeams, setSelectedTeams] = useState(new Set());
    const [primaryTeam, setPrimaryTeam] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            loadUserTeams();
        }
    }, [isOpen, user]);

    const loadUserTeams = async () => {
        try {
            setInitializing(true);

            // Get current team assignments from team_members
            const { data: teamMemberships, error } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id);

            if (error) throw error;

            const teamIds = new Set(teamMemberships?.map(tm => tm.team_id) || []);
            setSelectedTeams(teamIds);

            // Set primary team from user.team_id
            setPrimaryTeam(user.teams?.id || user.team_id || null);
        } catch (error) {
            console.error('Error loading user teams:', error);
            showToast('error', 'Failed to load teams', error.message);
        } finally {
            setInitializing(false);
        }
    };

    const toggleTeam = (teamId) => {
        const newSelected = new Set(selectedTeams);
        if (newSelected.has(teamId)) {
            newSelected.delete(teamId);
            // If removing primary team, clear it
            if (primaryTeam === teamId) {
                setPrimaryTeam(null);
            }
        } else {
            newSelected.add(teamId);
        }
        setSelectedTeams(newSelected);
    };

    const handleSetPrimary = (teamId) => {
        // Must be in selected teams
        if (!selectedTeams.has(teamId)) {
            setSelectedTeams(new Set([...selectedTeams, teamId]));
        }
        setPrimaryTeam(teamId);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // 1. Update team_members table
            // First, delete all existing team assignments
            const { error: deleteError } = await supabase
                .from('team_members')
                .delete()
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            // Then, insert new team assignments
            if (selectedTeams.size > 0) {
                const teamAssignments = Array.from(selectedTeams).map(teamId => ({
                    user_id: user.id,
                    team_id: teamId,
                    role: 'member'
                }));

                const { error: insertError } = await supabase
                    .from('team_members')
                    .insert(teamAssignments);

                if (insertError) throw insertError;
            }

            // 2. Update users.team_id with primary team
            const { error: updateError } = await supabase
                .from('users')
                .update({ team_id: primaryTeam })
                .eq('id', user.id);

            if (updateError) throw updateError;

            onSuccess();
        } catch (error) {
            console.error('Error saving teams:', error);
            showToast('error', 'Failed to save teams', error.message);
        } finally {
            setLoading(false);
        }
    };

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
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FiUsers className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Assign Teams</h3>
                                <p className="text-sm text-white/80">Manage teams for {user.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                        {initializing ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Info */}
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Tip:</strong> Select multiple teams and mark one as primary. The primary team will be used for default team-based filters.
                                    </p>
                                </div>

                                {/* Teams Grid */}
                                <div className="space-y-3">
                                    {teams.map((team, index) => {
                                        const isSelected = selectedTeams.has(team.id);
                                        const isPrimary = primaryTeam === team.id;

                                        return (
                                            <motion.div
                                                key={team.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${isPrimary
                                                        ? 'border-yellow-400 bg-yellow-50'
                                                        : isSelected
                                                            ? 'border-slate-400 bg-slate-50'
                                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => toggleTeam(team.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {/* Team Color Indicator */}
                                                        <div
                                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                            style={{ backgroundColor: getTeamColor(index) }}
                                                        >
                                                            {team.name.charAt(0).toUpperCase()}
                                                        </div>

                                                        {/* Team Name */}
                                                        <div>
                                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                                {team.name}
                                                                {isPrimary && (
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                                                                        <FiStar className="w-3 h-3" />
                                                                        Primary
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isSelected && !isPrimary && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSetPrimary(team.id);
                                                                    }}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                                                                >
                                                                    Set as primary
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Checkbox */}
                                                    <div
                                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                                ? 'bg-slate-600 border-slate-600'
                                                                : 'bg-white border-gray-300'
                                                            }`}
                                                    >
                                                        {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* No Teams */}
                                {teams.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>No teams available</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <motion.button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={!loading ? { scale: 1.02 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
