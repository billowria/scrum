import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiUsers, FiBriefcase, FiLink, FiCheck, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

export default function ManagerTeamAssignment() {
  const [managers, setManagers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [assignedTeams, setAssignedTeams] = useState(new Set());
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: managersData, error: managersError } = await supabase
        .from('users')
        .select('id, name, manager_teams(team_id)')
        .eq('role', 'manager');
      if (managersError) throw managersError;
      
      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('id, name');
      if (teamsError) throw teamsError;

      setManagers(managersData);
      setTeams(teamsData);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to fetch data: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (manager) => {
    setSelectedManager(manager);
    const initialAssigned = new Set(manager.manager_teams.map(t => t.team_id));
    setAssignedTeams(initialAssigned);
    setShowAssignModal(true);
  };

  const handleTeamToggle = (teamId) => {
    setAssignedTeams(prev => {
      const newAssigned = new Set(prev);
      if (newAssigned.has(teamId)) {
        newAssigned.delete(teamId);
      } else {
        newAssigned.add(teamId);
      }
      return newAssigned;
    });
  };

  const handleSaveAssignments = async () => {
    if (!selectedManager) return;
    
    const originalTeams = new Set(selectedManager.manager_teams.map(t => t.team_id));
    const teamsToUnassign = [...originalTeams].filter(id => !assignedTeams.has(id));
    const teamsToAssign = [...assignedTeams].filter(id => !originalTeams.has(id));

    try {
      if (teamsToUnassign.length > 0) {
        const { error } = await supabase
          .from('manager_teams')
          .delete()
          .eq('manager_id', selectedManager.id)
          .in('team_id', teamsToUnassign);
        if (error) throw error;
      }
      if (teamsToAssign.length > 0) {
        const newAssignments = teamsToAssign.map(teamId => ({ manager_id: selectedManager.id, team_id: teamId }));
        const { error } = await supabase.from('manager_teams').insert(newAssignments);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Assignments updated successfully.' });
      fetchData(); // Refresh data
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to update assignments: ${error.message}` });
    } finally {
      setShowAssignModal(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Manager Team Assignments</h2>
      <div className="space-y-3">
        {managers.map(manager => (
          <div key={manager.id} className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold">{manager.name}</p>
              <p className="text-sm text-gray-500">{manager.manager_teams.length} teams assigned</p>
            </div>
            <button
              onClick={() => openAssignModal(manager)}
              className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
            >
              <FiLink className="inline mr-1" />
              Assign Teams
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAssignModal && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div 
                className="bg-white rounded-lg shadow-xl w-full max-w-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="p-5">
                <h3 className="text-lg font-bold mb-4">Assign Teams to {selectedManager?.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {teams.map(team => (
                    <div
                      key={team.id}
                      onClick={() => handleTeamToggle(team.id)}
                      className={`p-3 rounded-md cursor-pointer border-2 transition-all ${
                        assignedTeams.has(team.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{team.name}</span>
                        {assignedTeams.has(team.id) && <FiCheck className="text-primary-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button onClick={handleSaveAssignments} className="px-4 py-2 bg-primary-600 text-white rounded-md">Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 