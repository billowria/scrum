import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiUserPlus, FiGrid, FiList, FiSearch, FiX, FiFilter, FiRefreshCw, FiLayers, FiCheckCircle, FiBriefcase } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import UserCardView from '../components/user-management/UserCardView';
import UserTableView from '../components/user-management/UserTableView';
import TeamManagementView from '../components/user-management/TeamManagementView';
import CreateTeamModal from '../components/user-management/CreateTeamModal';
import GlassmorphicToast from '../components/GlassmorphicToast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
};

export default function TeamManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany } = useCompany();

  // State
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'teams'
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState({});

  // Toast
  const [toast, setToast] = useState({ isVisible: false, type: 'success', message: '', description: '' });

  const showToast = (type, message, description = '') => {
    setToast({ isVisible: true, type, message, description });
  };

  // Fetch data
  useEffect(() => {
    if (currentCompany?.id) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchTeams()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, avatar_url, created_at,
          teams:team_id (id, name),
          manager:manager_id (id, name)
        `)
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;

      // Fetch team memberships for each user
      const usersWithTeams = await Promise.all(
        (data || []).map(async (user) => {
          const { data: teamMemberships } = await supabase
            .from('team_members')
            .select('team_id, teams(id, name)')
            .eq('user_id', user.id);

          return {
            ...user,
            assignedTeams: teamMemberships?.map(tm => tm.teams) || [],
            primaryTeam: user.teams
          };
        })
      );

      setUsers(usersWithTeams);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'Failed to load users', error.message);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setTeams(data || []);

      // Fetch team member counts
      const { data: membersData } = await supabase
        .from('team_members')
        .select('team_id, user_id');

      const membersByTeam = {};
      (membersData || []).forEach(member => {
        if (!membersByTeam[member.team_id]) {
          membersByTeam[member.team_id] = [];
        }
        membersByTeam[member.team_id].push(member.user_id);
      });
      setTeamMembers(membersByTeam);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    const matchesTeam = teamFilter === 'all' ||
      user.assignedTeams?.some(t => t?.id === teamFilter) ||
      user.primaryTeam?.id === teamFilter;

    return matchesSearch && matchesRole && matchesTeam;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.role).length,
    managers: users.filter(u => u.role === 'manager').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  // Calculate team stats
  const teamStats = {
    total: teams.length,
    withMembers: Object.keys(teamMembers).filter(teamId => (teamMembers[teamId] || []).length > 0).length,
    totalMembers: Object.values(teamMembers).reduce((acc, members) => acc + members.length, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
      {/* Toast */}
      <GlassmorphicToast
        type={toast.type}
        message={toast.message}
        description={toast.description}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Fixed Header */}
      <div className="z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg p-4 sticky top-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left Section - Dynamic Title */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className={`p-2 rounded-xl text-white shadow-lg transition-all duration-300 ${activeTab === 'users'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-indigo-200/50'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-200/50'
              }`}>
              {activeTab === 'users' ? <FiUsers className="w-5 h-5" /> : <FiLayers className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'users' ? 'User Management' : 'Team Management'}
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                {activeTab === 'users'
                  ? 'Manage users, roles, and assignments'
                  : 'Organize teams and member assignments'}
              </p>
            </div>
          </div>

          {/* Center Section - Toggle */}
          <div className="flex items-center justify-center w-full lg:w-auto">
            <div className="relative group">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 via-purple-400/30 to-pink-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative bg-white/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/50 shadow-xl overflow-hidden">
                {/* Animated Background Layers */}
                <div className="absolute inset-0">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-200/10 via-purple-200/15 to-pink-200/10"
                    animate={{
                      x: ['-100%', '100%'],
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: 1
                    }}
                  />
                </div>

                <div className="relative flex items-center gap-1">
                  {[
                    { id: 'users', icon: FiUsers, label: 'User Management', gradient: 'from-blue-500 via-indigo-500 to-purple-500' },
                    { id: 'teams', icon: FiLayers, label: 'Team Management', gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      className={`relative px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                        ? 'text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                        }`}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient}`}
                          layoutId="activeTab"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Dynamic Stats & Actions */}
          <div className="flex items-center gap-3 self-end lg:self-center">
            {/* Dynamic Animated Stats Pills with Expandable Labels */}
            <div className="hidden xl:flex items-center gap-2">
              <AnimatePresence mode="wait">
                {activeTab === 'users' ? (
                  <motion.div
                    key="user-stats"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    {/* Total Users */}
                    <motion.div
                      className="relative bg-gradient-to-r from-indigo-400 to-purple-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.1 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative flex items-center gap-1.5">
                        <FiUsers className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{stats.total}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Users
                        </motion.span>
                      </div>
                    </motion.div>

                    {/* Active Users */}
                    <motion.div
                      className="relative bg-gradient-to-r from-emerald-400 to-green-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.2 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                      />
                      <div className="relative flex items-center gap-1.5">
                        <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{stats.active}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Active
                        </motion.span>
                      </div>
                    </motion.div>

                    {/* Managers */}
                    <motion.div
                      className="relative bg-gradient-to-r from-blue-400 to-cyan-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.3 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                      />
                      <div className="relative flex items-center gap-1.5">
                        <FiBriefcase className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{stats.managers}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Managers
                        </motion.span>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="team-stats"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    {/* Total Teams */}
                    <motion.div
                      className="relative bg-gradient-to-r from-emerald-400 to-teal-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.1 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative flex items-center gap-1.5">
                        <FiLayers className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{teamStats.total}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Teams
                        </motion.span>
                      </div>
                    </motion.div>

                    {/* Active Teams */}
                    <motion.div
                      className="relative bg-gradient-to-r from-cyan-400 to-blue-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.2 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                      />
                      <div className="relative flex items-center gap-1.5">
                        <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{teamStats.withMembers}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Active
                        </motion.span>
                      </div>
                    </motion.div>

                    {/* Total Members */}
                    <motion.div
                      className="relative bg-gradient-to-r from-indigo-400 to-purple-400 px-2.5 py-1 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default"
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                        hover: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: 0.3 }}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-50 blur-md"></div>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                      />
                      <div className="relative flex items-center gap-1.5">
                        <FiUsers className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">{teamStats.totalMembers}</span>
                        {/* Expandable label on hover */}
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 inline-block align-middle"
                          variants={{
                            hidden: { width: 0, opacity: 0, marginLeft: 0 },
                            visible: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: 'auto', opacity: 1, marginLeft: 4 }
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          Members
                        </motion.span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden xl:block"></div>

            {/* Dynamic Create Button */}
            <AnimatePresence mode="wait">
              {activeTab === 'users' ? (
                <motion.button
                  key="create-user"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => navigate('/create-user', { state: { background: location } })}
                  className="px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-slate-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiUserPlus className="w-4 h-4" />
                  <span className="font-medium text-sm">Create User</span>
                </motion.button>
              ) : (
                <motion.button
                  key="create-team"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-4 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-emerald-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiLayers className="w-4 h-4" />
                  <span className="font-medium text-sm">Create Team</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 flex-1 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search & Filters */}
              <div className="mb-6 bg-white/60 backdrop-blur-xl rounded-xl shadow-md border border-white/30 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-white text-slate-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <FiGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-slate-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <FiList className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-gray-200 text-gray-700'
                      }`}
                  >
                    <FiFilter className="w-4 h-4" />
                    <span className="font-medium">Filters</span>
                  </button>

                  <button
                    onClick={handleRefresh}
                    className="p-2.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                          <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          >
                            <option value="all">All Teams</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User View Content */}
              {viewMode === 'card' ? (
                <UserCardView
                  users={filteredUsers}
                  teams={teams}
                  loading={loading}
                  onRefresh={handleRefresh}
                  showToast={showToast}
                />
              ) : (
                <UserTableView
                  users={filteredUsers}
                  teams={teams}
                  loading={loading}
                  onRefresh={handleRefresh}
                  showToast={showToast}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="teams"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TeamManagementView
                teams={teams}
                loading={loading}
                onRefresh={handleRefresh}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onSuccess={() => {
          handleRefresh();
          setShowCreateTeamModal(false);
          showToast('success', 'Team created successfully');
        }}
        showToast={showToast}
      />
    </div>
  );
}