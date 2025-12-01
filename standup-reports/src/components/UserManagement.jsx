import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiUser, FiUserX, FiUserCheck, FiUserPlus, FiTrash2, FiEdit2, FiShield, FiMail, FiLock, FiRefreshCw, FiSearch, FiX, FiCheck, FiFilter, FiMoreVertical, FiEye, FiEyeOff, FiUsers, FiSettings } from 'react-icons/fi';
import GlassmorphicToast from './GlassmorphicToast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function UserManagement({ searchQuery = '', setSearchQuery, searchValue = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany } = useCompany();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null); // Keeping for backward compatibility
  // Toast functionality
  const [toast, setToast] = useState({ isVisible: false, type: 'success', message: '', description: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Helper function to show toast notifications
  const showToast = (type, message, description = '') => {
    setToast({
      isVisible: true,
      type,
      message,
      description
    });
  };
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', team_id: '', manager_id: '' });

  // Update managers list when users change
  useEffect(() => {
    if (users && users.length > 0) {
      const filteredManagers = users.filter(user => user.role === 'admin' || user.role === 'manager');
      setManagers(filteredManagers);
    }
  }, [users]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      showToast('error', 'Validation Error', 'Team name is required');
      return;
    }

    if (!currentCompany?.id) {
      showToast('error', 'Company Error', 'Company information not available');
      return;
    }

    setCreatingTeam(true);

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name: newTeamName.trim(),
          company_id: currentCompany.id
        }])
        .select();

      if (error) throw error;

      // Refresh teams list
      fetchTeams();
      setNewTeamName('');
      setShowCreateTeamModal(false);
      showToast('success', 'Team Created', `Team "${newTeamName}" has been created successfully`);
    } catch (error) {
      console.error('Error creating team:', error.message);
      showToast('error', 'Error Creating Team', error.message);
    } finally {
      setCreatingTeam(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchTeams();
    fetchManagers();
  }, [refreshTrigger, currentCompany]);

  const fetchTeams = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };

  const fetchManagers = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('company_id', currentCompany.id)
        .in('role', ['admin', 'manager'])
        .order('name');

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, avatar_url, created_at,
          teams:team_id (id, name),
          manager:manager_id (id, name)
        `)
        .eq('company_id', currentCompany.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      // showToast('error', 'Error fetching users', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleUserAction = async (action, userIds = null) => {
    const ids = userIds || selectedUsers;
    if (!ids.length) {
      showToast('error', 'No users selected', 'Please select users first');
      return;
    }

    try {
      let successMessage = '';

      switch (action) {
        case 'activate':
          // Since there's no status field, activate functionality is not implemented
          showToast('error', 'Feature not available', 'Activate functionality requires a status field in the database');
          return;

        case 'deactivate':
          // Since there's no status field, deactivate functionality is not implemented
          showToast('error', 'Feature not available', 'Deactivate functionality requires a status field in the database');
          return;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .in('id', ids);

          if (deleteError) throw deleteError;
          successMessage = `User${ids.length > 1 ? 's' : ''} deleted successfully`;
          break;

        default:
          throw new Error('Invalid action');
      }

      showToast('success', 'Action completed', successMessage);
      setSelectedUsers([]);
      handleRefresh();
    } catch (error) {
      console.error(`Error performing ${action}:`, error.message);
      showToast('error', 'Action failed', error.message);
    }
  };

  // Since status field doesn't exist in the database yet, we'll assume all users are active
  const getUserStatus = (user) => {
    return 'active';
  };

  const updateUserField = async (userId, field, value) => {
    try {
      const updateData = {};
      updateData[field] = value;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, [field]: value }
            : user
        )
      );

      showToast('success', 'User updated successfully', `Successfully updated ${field} to ${value}`);
    } catch (error) {
      console.error(`Error updating user ${field}:`, error.message);
      showToast('error', 'Error updating user', error.message);
    }
  };

  const startEditing = (user) => {
    setEditingUser(user.id);
    setEditForm({
      role: user.role,
      team_id: user.team_id || '',
      manager_id: user.manager_id || ''
    });
  };

  const saveUserChanges = async (userId) => {
    try {
      const { role, team_id, manager_id } = editForm;

      const { error } = await supabase
        .from('users')
        .update({
          role,
          team_id: team_id || null,
          manager_id: manager_id || null
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, role, team_id: team_id || null, manager_id: manager_id || null }
            : user
        )
      );

      setEditingUser(null);
      showToast('success', 'User updated successfully', 'User information has been updated');
    } catch (error) {
      console.error('Error updating user:', error.message);
      showToast('error', 'Error updating user', error.message);
    }
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({ role: '', team_id: '', manager_id: '' });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'inactive': return 'bg-amber-100 text-amber-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const filteredUsers = (() => {
    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // No status filter since status field doesn't exist in the database

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower) ||
        user.teams?.name?.toLowerCase().includes(searchLower) ||
        user.manager?.name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  })();

  if (!currentUser || currentUser.role !== 'manager') {
    return (
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/60 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-200/40 to-amber-200/40 rounded-full blur-2xl" />

        <div className="relative p-8">
          <div className="flex items-start gap-4">
            <motion.div
              className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <FiShield className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Manager Access Required
                </span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  Restricted
                </span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                You need manager privileges to access this feature. Please contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Glassmorphic Toast Component */}
      <GlassmorphicToast
        type={toast.type}
        message={toast.message}
        description={toast.description}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
        duration={4000}
      />

      {/* Move Create Team modal button to the top section */}
      {/* Create Team Button */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiUser className="text-slate-700" />
            User Management
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchValue}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 w-full sm:w-64"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Create User Button - positioned alongside other action buttons */}
              <motion.button
                onClick={() => navigate('/create-user', { state: { background: location } })}
                className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-md shadow flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiUserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Create User</span>
                <span className="sm:hidden">User</span>
              </motion.button>

              {/* Create Team Button - positioned with Create User button */}
              <motion.button
                onClick={() => setShowCreateTeamModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-md shadow flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiUsers className="w-4 h-4" />
                <span className="hidden sm:inline">Create Team</span>
                <span className="sm:hidden">Team</span>
              </motion.button>

              {/* Role Filter */}
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <FiFilter size={14} />
                </div>
              </div>

              <div className="flex gap-2">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {selectedUsers.length > 0 && (
                    <motion.button
                      onClick={() => {
                        setSelectedAction('delete');
                        setShowActionsModal(true);
                      }}
                      className="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiTrash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </motion.button>
                  )}
                </div>

                <motion.button
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 hover:text-slate-600 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                  disabled={loading}
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FiRefreshCw className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            className="text-center py-16"
            variants={itemVariants}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FiUsers className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Users Found</h3>
            <p className="text-gray-500">No users match the selected filter criteria.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Users Table Header */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-indigo-200/30">
                <thead className="bg-gradient-to-r from-indigo-100/80 to-blue-100/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiMail className="text-indigo-600" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiShield className="text-indigo-600" />
                        <span>Role</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-indigo-600" />
                        <span>Team</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiUserCheck className="text-indigo-600" />
                        <span>Manager</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-center">
                        <FiSettings className="text-indigo-600" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-indigo-200/30">
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <motion.div
                            className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold shadow-md mr-3"
                            whileHover={{ scale: 1.05, rotate: 3 }}
                            style={{
                              background: user.avatar_url
                                ? 'transparent'
                                : `linear-gradient(135deg, hsl(${215 + index * 5}, 70%, 60%), hsl(${245 + index * 5}, 70%, 50%))`
                            }}
                          >
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-full h-full rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=64748b&color=fff`;
                                }}
                              />
                            ) : (
                              <span className="text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                            )}
                          </motion.div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.id ? (
                          <select
                            className="w-full px-2 py-1 text-xs bg-white/90 border border-indigo-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 font-medium"
                            value={editForm.role}
                            onChange={(e) => handleEditFormChange('role', e.target.value)}
                          >
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <div className="px-2 py-1 text-xs font-medium rounded-lg bg-indigo-100/60 text-indigo-800">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.id ? (
                          <select
                            className="w-full px-2 py-1 text-xs bg-white/90 border border-indigo-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 font-medium"
                            value={editForm.team_id}
                            onChange={(e) => handleEditFormChange('team_id', e.target.value)}
                          >
                            <option value="">Not assigned</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-2 py-1 text-xs font-medium rounded-lg bg-indigo-100/60 text-indigo-800">
                            {user.teams?.name || 'Not assigned'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.id ? (
                          <select
                            className="w-full px-2 py-1 text-xs bg-white/90 border border-indigo-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 font-medium"
                            value={editForm.manager_id}
                            onChange={(e) => handleEditFormChange('manager_id', e.target.value)}
                          >
                            <option value="">Not assigned</option>
                            {managers.map(manager => (
                              <option key={manager.id} value={manager.id}>{manager.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-2 py-1 text-xs font-medium rounded-lg bg-indigo-100/60 text-indigo-800">
                            {user.manager?.name || 'Not assigned'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1">
                          {editingUser === user.id ? (
                            <>
                              <motion.button
                                onClick={() => saveUserChanges(user.id)}
                                className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all shadow-sm"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <FiCheck className="w-3 h-3" />
                                <span className="hidden sm:inline">Save</span>
                              </motion.button>
                              <motion.button
                                onClick={cancelEditing}
                                className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-gray-500 to-slate-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all shadow-sm"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <FiX className="w-3 h-3" />
                                <span className="hidden sm:inline">Cancel</span>
                              </motion.button>
                            </>
                          ) : (
                            <motion.button
                              onClick={() => startEditing(user)}
                              className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all shadow-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiEdit2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Edit</span>
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => handleUserAction('delete', [user.id])}
                            className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all shadow-sm ml-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiTrash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create Team Modal */}
            <AnimatePresence>
              {showCreateTeamModal && (
                <motion.div
                  className="fixed inset-0 bg-gradient-to-br from-slate-900/70 to-slate-800/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCreateTeamModal(false)}
                >
                  <motion.div
                    className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 rounded-full blur-2xl" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <motion.div
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <FiUsers className="h-7 w-7 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Create New Team
                          </h3>
                          <p className="text-sm text-gray-600">Create a new team for your organization</p>
                        </div>
                      </div>

                      <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FiUserPlus className="h-4 w-4" />
                          Team Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-blue-200/60 rounded-2xl bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 font-medium"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="Enter team name..."
                          autoFocus
                        />
                      </motion.div>

                      <motion.div
                        className="flex justify-end gap-3 mt-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          type="button"
                          className="px-6 py-3 rounded-2xl border-2 border-gray-200/60 text-gray-700 bg-white/80 backdrop-blur-md font-semibold hover:bg-gray-100 transition-all duration-300"
                          onClick={() => {
                            setShowCreateTeamModal(false);
                            setNewTeamName('');
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="button"
                          className="relative px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                          onClick={handleCreateTeam}
                          disabled={creatingTeam || !newTeamName.trim()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 hover:opacity-100 transition-opacity" />
                          <span className="relative z-10">
                            {creatingTeam ? 'Creating...' : 'Create Team'}
                          </span>
                          {creatingTeam && (
                            <FiRefreshCw className="w-4 h-4 animate-spin relative z-10" />
                          )}
                        </motion.button>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Action Confirmation Modal */}
            <AnimatePresence>
              {showActionsModal && selectedAction && (
                <motion.div
                  className="fixed inset-0 bg-gradient-to-br from-slate-900/70 to-slate-800/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowActionsModal(false)}
                >
                  <motion.div
                    className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-white/20 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-200/40 to-gray-200/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gray-200/40 to-slate-200/40 rounded-full blur-2xl" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <motion.div
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-xl"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <FiTrash2 className="h-7 w-7 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r text-slate-800">
                            Confirm Delete
                          </h3>
                          <p className="text-sm text-gray-600">
                            Are you sure you want to delete {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}?
                          </p>
                        </div>
                      </div>

                      <motion.div
                        className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="text-sm text-red-600">
                          Warning: This action is irreversible and will permanently remove the selected users.
                        </div>
                      </motion.div>

                      <motion.div
                        className="flex justify-end gap-3 mt-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          type="button"
                          className="px-6 py-3 rounded-2xl border-2 border-gray-200/60 text-gray-700 bg-white/80 backdrop-blur-md font-semibold hover:bg-gray-100 transition-all duration-300"
                          onClick={() => setShowActionsModal(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="button"
                          className="relative px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={() => {
                            handleUserAction('delete');
                            setShowActionsModal(false);
                            setSelectedAction(null);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-600 to-pink-700 opacity-0 hover:opacity-100 transition-opacity" />
                          <span className="relative z-10">Confirm Delete</span>
                        </motion.button>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}