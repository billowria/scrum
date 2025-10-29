import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  FiUsers, FiUserCheck, FiUserPlus, FiSearch, FiFilter, FiRefreshCw, FiSettings,
  FiTrendingUp, FiActivity, FiZap, FiGrid, FiList, FiMoreVertical, FiChevronDown,
  FiBell, FiShield, FiTarget, FiAward, FiStar, FiEye, FiEdit3, FiTrash2,
  FiArrowUp, FiArrowDown, FiClock, FiCalendar, FiMapPin, FiMail, FiPhone,
  FiDownload, FiUpload, FiSave, FiX, FiCheck, FiAlertCircle, FiInfo
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import TeamAssignment from '../components/TeamAssignment';
import TeamManagementCombined from '../components/TeamManagementCombined';

// Advanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.8
    },
  },
};

const tabVariants = {
  hidden: { opacity: 0, scale: 0.9, rotateX: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    rotateX: 10,
    transition: { duration: 0.2 }
  }
};

// Floating particles animation
const FloatingParticle = ({ delay, duration, size, color }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${color} opacity-20 blur-sm`}
      style={{ width: size, height: size }}
      animate={{
        y: [-100, -100 - Math.random() * 200],
        x: [0, Math.random() * 100 - 50],
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    />
  );
};

export default function TeamManagement({ activeSubTab = 'team-management', setActiveSubTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const containerRef = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });

  // Parallax effects
  const headerY = useTransform(scrollY, [0, 100], [0, -20]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.8]);
  const springConfig = { stiffness: 400, damping: 30 };
  const headerScale = useSpring(1, springConfig);

  const handleTabChange = (tabId) => {
    if (setActiveSubTab) setActiveSubTab(tabId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const tabs = [
    {
      id: 'team-management',
      label: 'User Management',
      icon: <FiUsers />,
      color: 'from-violet-600 to-indigo-600',
      description: 'Manage team and delegation',
      stats: { count: 24, trend: '+12%' }
    },
    {
      id: 'team-assignment',
      label: 'Team Assignment',
      icon: <FiUserPlus />,
      color: 'from-emerald-600 to-teal-600',
      description: 'Assign to teams',
      stats: { count: 8, trend: '+3' }
    },
  ];

  const activeTab = tabs.find(tab => tab.id === activeSubTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-20 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1500" />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            duration={3 + Math.random() * 4}
            size={4 + Math.random() * 8}
            color={i % 3 === 0 ? 'bg-violet-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-amber-400'}
          />
        ))}
      </div>

      {/* Compact Glassmorphic Header */}
      <motion.header
        className="relative z-30 bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-xl"
        style={{ y: headerY, opacity: headerOpacity, scale: headerScale }}
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Logo/Icon with animation */}
              <motion.div
                className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl relative overflow-hidden group"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <FiUsers className="w-6 h-6 relative z-10" />
              </motion.div>

              {/* Title with gradient text */}
              <div>
                <motion.h1
                  className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Workforce Management
                </motion.h1>
                <motion.p
                  className="text-sm text-gray-600 font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {activeTab?.description || 'Manage your organization'}
                </motion.p>
              </div>
            </div>

            {/* Right Section - Controls */}
            <div className="flex items-center gap-3">
              {/* Stats Pills */}
              <motion.div className="hidden md:flex items-center gap-2">
                {activeTab?.stats && (
                  <>
                    <motion.div
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-full flex items-center gap-2 border border-violet-200/50"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <FiTrendingUp className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-sm font-semibold text-violet-700">{activeTab.stats.count}</span>
                      <span className="text-xs text-green-600 font-medium">{activeTab.stats.trend}</span>
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* Search Bar */}
              <motion.div
                className="relative hidden lg:block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <motion.div className="flex bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1">
                  {[
                    { mode: 'grid', icon: <FiGrid /> },
                    { mode: 'list', icon: <FiList /> }
                  ].map(({ mode, icon }) => (
                    <motion.button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === mode
                          ? 'bg-violet-100 text-violet-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {icon}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Refresh Button */}
                <motion.button
                  onClick={handleRefresh}
                  className="p-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-all shadow-sm"
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                >
                  <FiRefreshCw className="w-4.5 h-4.5" />
                </motion.button>

                {/* Settings Button */}
                <motion.button
                  className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiSettings className="w-4.5 h-4.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.div
        className="relative z-20 px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={containerRef}
      >
        {/* Modern Tab Navigation */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <div className="relative bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl p-2 shadow-2xl">
            {/* Tab Buttons */}
            <div className="relative flex z-10">
              {tabs.map((tab, index) => {
                const isActive = activeSubTab === tab.id;
                const isHovered = hoveredTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-4 rounded-xl transition-all ${
                      isActive
                        ? 'text-white bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Icon with animation */}
                    <motion.div
                      className={`p-2 rounded-lg ${
                        isActive ? 'bg-white/20' : isHovered ? 'bg-gray-100' : ''
                      }`}
                      animate={{
                        rotate: isActive ? [0, 5, -5, 0] : 0,
                        scale: isActive ? [1, 1.1, 1] : isHovered ? 1.05 : 1
                      }}
                      transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                        repeatType: 'reverse'
                      }}
                    >
                      {tab.icon}
                    </motion.div>

                    {/* Label */}
                    <div className="text-center">
                      <div className="font-semibold text-sm">{tab.label}</div>
                      <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {tab.description}
                      </div>
                    </div>

                    {/* Stats Badge */}
                    {tab.stats && (
                      <motion.div
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                      >
                        {tab.stats.count}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab Content with Enhanced Animations */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {activeSubTab === 'team-management' && (
              <motion.div
                key="team-management"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
              >
                {/* Enhanced Content Header with Actions */}
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-violet-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg relative overflow-hidden group"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {/* Animated shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <FiUsers className="w-6 h-6 relative z-10" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
                        <p className="text-sm text-gray-600">View and manage all team members and their managers in your organization</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {/* Quick Stats */}
                      <div className="flex items-center gap-4">
                        <motion.div className="text-center bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-violet-200/50">
                          <div className="text-2xl font-bold text-violet-600">24</div>
                          <div className="text-xs text-gray-500">Total Members</div>
                        </motion.div>
                        <motion.div className="text-center bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-amber-200/50">
                          <div className="text-2xl font-bold text-amber-600">5</div>
                          <div className="text-xs text-gray-500">Managers</div>
                        </motion.div>
                      </div>

                      {/* Beautiful Add Team Button */}
                      <motion.button
                        onClick={() => window.location.href = '/manager-dashboard?tab=add-member'}
                        className="group relative px-6 py-3 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Animated background effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />

                        {/* Button content */}
                        <div className="relative z-10 flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <FiUserPlus className="w-5 h-5" />
                          </motion.div>
                          <span className="font-semibold">Add Team</span>
                        </div>

                        {/* Glow effect on hover */}
                        <motion.div
                          className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Component Content */}
                <div className="p-6">
                  <TeamManagementCombined />
                </div>
              </motion.div>
            )}

            {activeSubTab === 'team-assignment' && (
              <motion.div
                key="team-assignment"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
              >
                {/* Content Header */}
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <FiUserPlus className="w-6 h-6" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Team Assignment</h2>
                        <p className="text-sm text-gray-600">Assign team members to specific teams or projects</p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4">
                      <motion.div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">8</div>
                        <div className="text-xs text-gray-500">Teams</div>
                      </motion.div>
                      <motion.div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">+3</div>
                        <div className="text-xs text-gray-500">New This Week</div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Component Content */}
                <div className="p-6">
                  <TeamAssignment />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}