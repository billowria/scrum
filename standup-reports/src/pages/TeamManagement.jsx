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

export default function TeamManagement({ sidebarMode }) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col">
      {/* Toast */}
      <GlassmorphicToast
        type={toast.type}
        message={toast.message}
        description={toast.description}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Animated Background Orbs (Consistent with new theme) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Fixed Dynamic Header - Standup Reports Style */}
      <motion.div
        className="fixed top-16 right-0 z-50 px-6 py-4 pointer-events-none"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        style={{
          left: sidebarMode === 'expanded' ? '272px' : sidebarMode === 'collapsed' ? '100px' : '0px',
          width: sidebarMode === 'expanded' ? 'calc(100% - 272px)' : sidebarMode === 'collapsed' ? 'calc(100% - 100px)' : '100%',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div
          className="pointer-events-auto relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-[20px] backdrop-saturate-[180%] rounded-[2rem] p-2 border border-white/20 dark:border-slate-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex flex-col lg:flex-row items-center justify-between group gap-4"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
          }}
        >
          {/* Liquid Sheen Effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(
                800px circle at var(--mouse-x) var(--mouse-y), 
                rgba(255, 255, 255, 0.15), 
                transparent 40%
              )`
            }}
          />

          {/* Left Section - Dynamic Title */}
          <div className="flex items-center gap-4 px-4 relative z-10 self-start lg:self-center">
            <div className="relative group/icon cursor-pointer">
              <div className={`absolute inset-0 rounded-2xl blur-lg opacity-40 transition-opacity ${activeTab === 'users'
                ? 'bg-gradient-to-tr from-blue-500 to-purple-500'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                }`}></div>
              <div className={`relative p-2.5 rounded-2xl text-white shadow-lg ring-1 ring-white/20 group-hover/icon:scale-105 transition-transform duration-300 ${activeTab === 'users'
                ? 'bg-gradient-to-tr from-blue-500 to-purple-600 shadow-blue-500/30'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
                }`}>
                {activeTab === 'users' ? <FiUsers className="w-5 h-5" /> : <FiLayers className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                {activeTab === 'users' ? 'User Management' : 'Team Management'}
              </h1>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:block">
                {activeTab === 'users'
                  ? 'Manage users, roles, and assignments'
                  : 'Organize teams and members'}
              </p>
            </div>
          </div>

          {/* Center Section - Futuristic Toggle */}
          <div className="flex bg-gray-100/30 dark:bg-slate-800/40 backdrop-blur-xl p-1.5 rounded-2xl relative z-10 border border-white/40 dark:border-slate-700/50 shadow-inner overflow-hidden">
            {[
              { id: 'users', icon: FiUsers, label: 'Users', gradient: 'from-blue-500 via-indigo-500 to-purple-500' },
              { id: 'teams', icon: FiLayers, label: 'Teams', gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 z-10 ${activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/50'
                  }`}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient}`}
                    layoutId="activeTabGlow"
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

          {/* Right Section - Dynamic Stats & Actions */}
          <div className="flex items-center gap-3 px-4 relative z-10 self-end lg:self-center">
            {/* Stats Pills */}
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
                    {[
                      { icon: FiUsers, value: stats.total, label: 'Users', gradient: 'from-indigo-400 to-purple-400', delay: 0.1 },
                      { icon: FiCheckCircle, value: stats.active, label: 'Active', gradient: 'from-emerald-400 to-green-400', delay: 0.2 },
                      { icon: FiBriefcase, value: stats.managers, label: 'Managers', gradient: 'from-blue-400 to-cyan-400', delay: 0.3 }
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        className={`relative bg-gradient-to-r ${stat.gradient} px-3 py-1.5 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default group/stat`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: stat.delay }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center gap-1.5">
                          <stat.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{stat.value}</span>
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 w-0 group-hover/stat:w-auto group-hover/stat:ml-1 transition-all duration-300"
                          >
                            {stat.label}
                          </motion.span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="team-stats"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    {[
                      { icon: FiLayers, value: teamStats.total, label: 'Teams', gradient: 'from-emerald-400 to-teal-400', delay: 0.1 },
                      { icon: FiCheckCircle, value: teamStats.withMembers, label: 'Active', gradient: 'from-cyan-400 to-blue-400', delay: 0.2 },
                      { icon: FiUsers, value: teamStats.totalMembers, label: 'Members', gradient: 'from-indigo-400 to-purple-400', delay: 0.3 }
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        className={`relative bg-gradient-to-r ${stat.gradient} px-3 py-1.5 rounded-full text-white shadow-lg overflow-hidden backdrop-blur-sm cursor-default group/stat`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: stat.delay }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center gap-1.5">
                          <stat.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-bold">{stat.value}</span>
                          <motion.span
                            className="overflow-hidden whitespace-nowrap text-[10px] font-medium opacity-90 w-0 group-hover/stat:w-auto group-hover/stat:ml-1 transition-all duration-300"
                          >
                            {stat.label}
                          </motion.span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-slate-700/50 mx-2 hidden xl:block"></div>

            {/* Dynamic Create Button */}
            <AnimatePresence mode="wait">
              {activeTab === 'users' ? (
                <motion.button
                  key="create-user"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => navigate('/create-user', { state: { background: location } })}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-slate-700/50 dark:border-white/20"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiUserPlus className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-tight">Create User</span>
                </motion.button>
              ) : (
                <motion.button
                  key="create-team"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-emerald-700/50 dark:border-emerald-400/20"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiLayers className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-tight">Create Team</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Padded for Fixed Header */}
      <motion.div
        className="relative z-10 px-4 sm:px-6 lg:px-8 pt-32 pb-6 flex-1 overflow-y-auto"
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
              <div className="mb-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-800/50 p-4 transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative group/search">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100/50 dark:bg-slate-800/50 rounded-xl p-1 border border-gray-200/50 dark:border-slate-700/50">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiList className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-bold text-sm ${showFilters
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    <FiFilter className="w-4 h-4" />
                    Filters
                  </button>

                  <button
                    onClick={handleRefresh}
                    className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
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
                      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Role</label>
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white transition-all font-medium"
                          >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Team</label>
                          <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white transition-all font-medium"
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