import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiFolder, FiUsers, FiCalendar, FiSearch, FiGrid, FiList, FiStar,
  FiClock, FiUser, FiChevronDown, FiX, FiRefreshCw, FiEye, FiAlertCircle,
  FiSettings, FiTrendingUp, FiPlus, FiFilter, FiMoreVertical, FiMenu,
  FiEdit2, FiEdit3, FiTrash2, FiUserPlus, FiCheck, FiLoader, FiBriefcase,
  FiTarget, FiZap, FiAward, FiTrendingUp as FiTrendingUpIcon
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import ContentLoader from '../components/ContentLoader';
import Avatar, { AvatarGroup } from '../components/shared/Avatar';
import Badge from '../components/shared/Badge';
import LoadingSkeleton, { SkeletonCard } from '../components/shared/LoadingSkeleton';
import { notifyProjectUpdate } from '../utils/notificationHelper';
import { useCompany } from '../contexts/CompanyContext';

// Import design system
import { colors, animations, shadows, breakpoints, typography } from '../config/designSystem';

// ============================================
// MODERN DESIGN SYSTEM
// ============================================

// Modern color palette
const modernColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  }
};

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  hover: { 
    y: -8, 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const sidebarVariants = {
  initial: { x: -320, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.8,
      restDelta: 0.001
    }
  },
  exit: { 
    x: -320, 
    opacity: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Enhanced Hamburger Menu Component with animations
const HamburgerMenu = ({ isOpen, onClick, className = '', isMobile = false }) => {
  const buttonRef = useRef(null);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`relative z-50 p-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 ${
        isMobile
          ? 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
      title={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <motion.div
        className="w-4 h-3.5 relative flex flex-col justify-center items-center"
        animate={isOpen ? "open" : "closed"}
      >
        {/* Top line */}
        <motion.span
          className="absolute h-0.5 w-4 bg-current rounded-full"
          variants={{
            closed: {
              rotate: 0,
              y: -5,
              backgroundColor: isMobile ? '#475569' : '#6b7280'
            },
            open: {
              rotate: 45,
              y: 0,
              backgroundColor: isMobile ? '#1e293b' : '#374151'
            }
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            backgroundColor: { duration: 0.2 }
          }}
        />
        
        {/* Middle line */}
        <motion.span
          className="absolute h-0.5 w-4 bg-current rounded-full"
          variants={{
            closed: {
              opacity: 1,
              backgroundColor: isMobile ? '#475569' : '#6b7280'
            },
            open: {
              opacity: 0,
              backgroundColor: isMobile ? '#1e293b' : '#374151'
            }
          }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
            backgroundColor: { duration: 0.2 }
          }}
        />
        
        {/* Bottom line */}
        <motion.span
          className="absolute h-0.5 w-4 bg-current rounded-full"
          variants={{
            closed: {
              rotate: 0,
              y: 5,
              backgroundColor: isMobile ? '#475569' : '#6b7280'
            },
            open: {
              rotate: -45,
              y: 0,
              backgroundColor: isMobile ? '#1e293b' : '#374151'
            }
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            backgroundColor: { duration: 0.2 }
          }}
        />
      </motion.div>
      
      {/* Subtle pulse effect when focused */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-blue-500/10"
        initial={{ opacity: 0, scale: 0.9 }}
        whileFocus={{
          opacity: 1,
          scale: 1,
          transition: { duration: 0.2 }
        }}
      />
    </motion.button>
  );
};

// ============================================
// STREAMLINED PROJECTS SIDEBAR COMPONENT
// ============================================

const ProjectsSidebar = ({
  projects,
  activeFilter,
  onProjectSelect,
  isOpen,
  onClose,
  isMobile,
  favoriteProjects,
  sidebarCollapsed,
  onToggleSidebarCollapse,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  const toggleSection = () => {
    setExpanded(!expanded);
  };

  const toggleFavoritesSection = () => {
    setFavoritesExpanded(!favoritesExpanded);
  };

  // Filter favorite projects based on is_favorite field from project_assignments
  const favoriteProjectsList = projects.filter(project => project.is_favorite === true);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'archived':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      {/* Mobile Overlay with Enhanced Animation */}
      {isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                transition: { 
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }
              }}
              exit={{ 
                opacity: 0,
                transition: { 
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              onClick={onClose}
            />
          )}
        </AnimatePresence>
      )}
      
      {isMobile ? (
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              className="bg-white text-gray-800 h-full overflow-hidden flex flex-col shadow-lg border-r border-gray-200 fixed left-0 top-0 z-50 w-80"
              variants={sidebarVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94],
                bounce: 0.3
              }}
            >
              {/* Sidebar Header with Toggle Button */}
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                {!sidebarCollapsed && (
                  <h2 className="text-lg font-bold text-gray-800">
                    Project Spaces
                  </h2>
                )}
                
                {/* Toggle Button */}
                <motion.button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Project Spaces Section */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Favorites Section */}
                {favoriteProjectsList.length > 0 && (
                  <div className="mb-4">
                    <motion.button
                      onClick={toggleFavoritesSection}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500">
                          <FiStar className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-800 font-medium">Favorites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-100 px-2 py-1 rounded-full text-amber-700">
                          {favoriteProjectsList.length}
                        </span>
                        <motion.div
                          animate={{ rotate: favoritesExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown className="w-4 h-4 text-gray-500" />
                        </motion.div>
                      </div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {favoritesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 mt-2 overflow-hidden"
                        >
                          {favoriteProjectsList.map((project) => {
                            const progress = Math.floor(Math.random() * 100); // Mock progress
                            const teamCount = Math.floor(Math.random() * 10) + 1; // Mock team count
                            
                            return (
                              <motion.button
                                key={project.id}
                                onClick={() => onProjectSelect(project)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                                  activeFilter === project.id
                                    ? 'bg-amber-50 border border-amber-300'
                                    : 'bg-amber-50/50 hover:bg-amber-50 border border-transparent hover:border-amber-300'
                                }`}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 bg-opacity-80">
                                  <FiStar className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800 truncate flex items-center gap-2">
                                    {project.name}
                                    <FiStar className="w-3 h-3 text-amber-500" fill="currentColor" />
                                  </div>
                                  {project.description && (
                                    <div className="text-xs text-gray-500 truncate">{project.description}</div>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1">
                                      <FiUsers className="w-3 h-3 text-gray-500" />
                                      <span className="text-xs text-gray-500">{teamCount}</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full ${getProgressColor(progress)}`}
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{progress}%</span>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text} ${getStatusColor(project.status).border}`}>
                                  {project.status}
                                </span>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <motion.button
                  onClick={toggleSection}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500">
                      <FiFolder className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">Project Spaces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                      {projects.length}
                    </span>
                    <motion.div
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiChevronDown className="w-4 h-4 text-gray-500" />
                    </motion.div>
                  </div>
                </motion.button>
                
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 mt-2 overflow-hidden"
                    >
                      {projects.map((project) => {
                        const progress = Math.floor(Math.random() * 100); // Mock progress
                        const teamCount = Math.floor(Math.random() * 10) + 1; // Mock team count
                        
                        return (
                          <motion.button
                            key={project.id}
                            onClick={() => onProjectSelect(project)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                              activeFilter === project.id
                                ? 'bg-blue-50 border border-blue-300'
                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-300'
                            }`}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="p-2 rounded-lg bg-blue-500 bg-opacity-80">
                              <FiFolder className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{project.name}</div>
                              {project.description && (
                                <div className="text-xs text-gray-500 truncate">{project.description}</div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <FiUsers className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">{teamCount}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${getProgressColor(progress)}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">{progress}%</span>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text} ${getStatusColor(project.status).border}`}>
                              {project.status}
                            </span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      ) : (
        <motion.aside
          className={`bg-white text-gray-800 h-full overflow-hidden flex flex-col shadow-lg border-r border-gray-200 ${
            sidebarCollapsed
              ? 'w-16 relative'
              : 'w-80 relative'
          } ${className}`}
          variants={sidebarVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94],
            bounce: 0.3
          }}
        >
          {/* Sidebar Header with Toggle Button */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-bold text-gray-800">
                Project Spaces
              </h2>
            )}
            
            {/* Enhanced Toggle Button */}
            <HamburgerMenu
              isOpen={!sidebarCollapsed}
              onClick={onToggleSidebarCollapse}
              isMobile={false}
              className="ml-2"
            />
          </div>

          {/* Project Spaces Section */}
          <div className="flex-1 overflow-y-auto p-4">
            {sidebarCollapsed ? (
              // Collapsed state - show only icons
              <div className="space-y-4">
                {/* Favorites Section - Collapsed */}
                {favoriteProjectsList.length > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 mb-1">
                      <FiStar className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-gray-500">{favoriteProjectsList.length}</span>
                  </div>
                )}
                
                {/* Projects Section - Collapsed */}
                <div className="flex flex-col items-center">
                  <div className="p-2 rounded-lg bg-blue-500 mb-1">
                    <FiFolder className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">{projects.length}</span>
                </div>
              </div>
            ) : (
              // Expanded state - show full content
              <>
                {/* Favorites Section */}
                {favoriteProjectsList.length > 0 && (
                  <div className="mb-4">
                    <motion.button
                      onClick={toggleFavoritesSection}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500">
                          <FiStar className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-800 font-medium">Favorites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-100 px-2 py-1 rounded-full text-amber-700">
                          {favoriteProjectsList.length}
                        </span>
                        <motion.div
                          animate={{ rotate: favoritesExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown className="w-4 h-4 text-gray-500" />
                        </motion.div>
                      </div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {favoritesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 mt-2 overflow-hidden"
                        >
                          {favoriteProjectsList.map((project) => {
                            const progress = Math.floor(Math.random() * 100); // Mock progress
                            const teamCount = Math.floor(Math.random() * 10) + 1; // Mock team count
                            
                            return (
                              <motion.button
                                key={project.id}
                                onClick={() => onProjectSelect(project)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                                  activeFilter === project.id
                                    ? 'bg-amber-50 border border-amber-300'
                                    : 'bg-amber-50/50 hover:bg-amber-50 border border-transparent hover:border-amber-300'
                                }`}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 bg-opacity-80">
                                  <FiStar className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800 truncate flex items-center gap-2">
                                    {project.name}
                                    <FiStar className="w-3 h-3 text-amber-500" fill="currentColor" />
                                  </div>
                                  {project.description && (
                                    <div className="text-xs text-gray-500 truncate">{project.description}</div>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1">
                                      <FiUsers className="w-3 h-3 text-gray-500" />
                                      <span className="text-xs text-gray-500">{teamCount}</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full ${getProgressColor(progress)}`}
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{progress}%</span>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text} ${getStatusColor(project.status).border}`}>
                                  {project.status}
                                </span>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <motion.button
                  onClick={toggleSection}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500">
                      <FiFolder className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">Project Spaces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                      {projects.length}
                    </span>
                    <motion.div
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiChevronDown className="w-4 h-4 text-gray-500" />
                    </motion.div>
                  </div>
                </motion.button>
                
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 mt-2 overflow-hidden"
                    >
                      {projects.map((project) => {
                        const progress = Math.floor(Math.random() * 100); // Mock progress
                        const teamCount = Math.floor(Math.random() * 10) + 1; // Mock team count
                        
                        return (
                          <motion.button
                            key={project.id}
                            onClick={() => onProjectSelect(project)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                              activeFilter === project.id
                                ? 'bg-blue-50 border border-blue-300'
                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-300'
                            }`}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="p-2 rounded-lg bg-blue-500 bg-opacity-80">
                              <FiFolder className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{project.name}</div>
                              {project.description && (
                                <div className="text-xs text-gray-500 truncate">{project.description}</div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <FiUsers className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">{teamCount}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${getProgressColor(progress)}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">{progress}%</span>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text} ${getStatusColor(project.status).border}`}>
                              {project.status}
                            </span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.aside>
      )}
    </>
  );
};

// ============================================
// MODERN COMPACT HEADER COMPONENT
// ============================================

const ProjectsHeader = ({
  userRole,
  projects,
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  loading,
  stats,
  onToggleSidebar,
  isMobile,
  onCreateProject,
  navigate
}) => {
  return (
    <motion.header
      className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 backdrop-blur-sm px-4 lg:px-6 py-3 lg:py-4 shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex flex-col gap-3">
        {/* Top Bar - Title and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <HamburgerMenu
                isOpen={true}
                onClick={onToggleSidebar}
                isMobile={true}
                className="backdrop-blur-sm"
              />
            )}
            
            {/* Title Section */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="text-xs lg:text-sm text-slate-500 font-medium">
                Manage and explore your project spaces
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Stats Pills - Desktop Only */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-1 mr-4">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-white/60 rounded-lg border border-slate-200/50 backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    <span className="text-xs font-semibold text-slate-700">{stats.total}</span>
                    <span className="text-xs text-slate-500">Total</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-emerald-700">{stats.active}</span>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-semibold text-blue-700">{stats.completed}</span>
                    <span className="text-xs text-slate-500">Done</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Advanced Project Management Button */}
            <motion.button
              onClick={() => navigate('/project-management')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mr-2"
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.5)" }}
              whileTap={{ scale: 0.97 }}
              title="Advanced Project Management"
            >
              <FiSettings size={16} />
              <span className="hidden sm:inline">Advanced</span>
            </motion.button>
            
            {/* Create Project Button */}
            <motion.button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.97 }}
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">Create</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Stats Overview */}
        {isMobile && (
          <motion.div
            className="flex items-center justify-between bg-white/60 rounded-lg p-2 border border-slate-200/50 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { label: 'Total', value: stats.total, color: 'bg-slate-500' },
              { label: 'Active', value: stats.active, color: 'bg-emerald-500' },
              { label: 'Completed', value: stats.completed, color: 'bg-blue-500' },
              { label: 'Archived', value: stats.archived, color: 'bg-slate-400' }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 px-2">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${stat.color}`}></div>
                  <span className="text-sm font-bold text-slate-700">{stat.value}</span>
                </div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Control Panel */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Search and Filters */}
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-8 py-2 bg-white/70 border border-slate-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 text-slate-900 placeholder-slate-400 text-sm backdrop-blur-sm"
              />
              {search && (
                <motion.button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={14} />
                </motion.button>
              )}
            </div>
            
            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-white/60 rounded-lg p-1 border border-slate-200/50 backdrop-blur-sm">
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'active', label: 'Active', count: stats.active },
                { key: 'completed', label: 'Done', count: stats.completed },
                { key: 'archived', label: 'Archive', count: stats.archived }
              ].map((filter) => (
                <motion.button
                  key={filter.key}
                  onClick={() => onFilterChange(filter.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                    filterStatus === filter.key
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{filter.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filterStatus === filter.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {filter.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white/60 rounded-lg p-1 border border-slate-200/50 backdrop-blur-sm">
              <motion.button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiGrid size={16} />
              </motion.button>
              <motion.button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiList size={16} />
              </motion.button>
            </div>

            {/* Refresh Button */}
            <motion.button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/70 rounded-lg transition-all duration-200 backdrop-blur-sm"
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh projects"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// ============================================
// MODERN PROJECT CARD COMPONENT
// ============================================

const ProjectCard = ({
  project,
  onToggleFavorite,
  isFavorite,
  viewMode = 'grid',
  teamMembers = [],
  onEditProject,
  onDeleteProject,
  onAssignUsers,
  onViewMembers,
  canManageProject
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Debug logging for button visibility
  console.log(`[DEBUG] ProjectCard for project ${project.id}:`, {
    projectName: project.name,
    canManageProject,
    viewMode
  });
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500',
          label: 'Active',
          icon: '🟢'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          label: 'Completed',
          icon: '🔵'
        };
      case 'archived':
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500',
          label: 'Archived',
          icon: '⚪'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500',
          label: 'Unknown',
          icon: '❓'
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate progress with real data
  const [progress, setProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  
  // Fetch task data for progress calculation
  useEffect(() => {
    const fetchTaskProgress = async () => {
      try {
        setLoadingProgress(true);
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('status')
          .eq('project_id', project.id);
          
        if (error) throw error;
        
        if (tasks && tasks.length > 0) {
          const completedTasks = tasks.filter(task => task.status === 'done').length;
          const calculatedProgress = Math.round((completedTasks / tasks.length) * 100);
          setProgress(calculatedProgress);
        } else {
          setProgress(0);
        }
      } catch (err) {
        console.error('Error fetching task progress:', err);
        setProgress(0);
      } finally {
        setLoadingProgress(false);
      }
    };
    
    fetchTaskProgress();
  }, [project.id]);
  
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (progress >= 50) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (progress >= 30) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };
  
  // Glassmorphic icon styles
  const getGlassmorphicIconStyle = (iconType, viewMode = 'grid') => {
    const baseTextColor = viewMode === 'list' ? 'text-gray-700' : 'text-white';
    const baseStyle = `p-2.5 backdrop-blur-md rounded-xl transition-all duration-300 border border-white/20 shadow-lg ${baseTextColor} hover:scale-110`;
    
    switch(iconType) {
      case 'favorite':
        return `${baseStyle} hover:bg-gradient-to-r hover:from-amber-400/50 hover:to-yellow-400/50 hover:text-amber-700 hover:shadow-amber-500/25`;
      case 'edit':
        return `${baseStyle} hover:bg-gradient-to-r hover:from-blue-400/50 hover:to-indigo-400/50 hover:text-blue-700 hover:shadow-blue-500/25`;
      case 'assign':
        return `${baseStyle} hover:bg-gradient-to-r hover:from-purple-400/50 hover:to-pink-400/50 hover:text-purple-700 hover:shadow-purple-500/25`;
      case 'members':
        return `${baseStyle} hover:bg-gradient-to-r hover:from-teal-400/50 hover:to-cyan-400/50 hover:text-teal-700 hover:shadow-teal-500/25`;
      case 'delete':
        return `${baseStyle} hover:bg-gradient-to-r hover:from-red-400/50 hover:to-rose-400/50 hover:text-red-700 hover:shadow-red-500/25`;
      default:
        return baseStyle;
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        className="bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden group"
        variants={cardVariants}
        whileHover="hover"
        onClick={() => navigate(`/projects/${project.id}?editMode=${isEditMode}`)}
      >
        <div className="p-6">
          <div className="flex items-center gap-6">
            {/* Project Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiFolder className="w-8 h-8" />
              </div>
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 truncate">{project.name}</h3>
                <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                  <div className={`w-2 h-2 ${statusConfig.dot} rounded-full`} />
                  {statusConfig.label}
                </span>
              </div>
              
              <div
                className="text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: project.description || 'No description available'
                }}
              />
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  {formatDate(project.start_date)} - {formatDate(project.end_date)}
                </span>
                <span className="flex items-center gap-2">
                  <FiUsers className="w-4 h-4" />
                  {teamMembers.length} members
                </span>
                {project.created_by_user && (
                  <span className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    {project.created_by_user.name}
                  </span>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="flex-shrink-0 w-40">
              <div className="text-sm font-medium text-gray-700 mb-2">Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                {loadingProgress ? (
                  <div className="h-3 rounded-full bg-gray-300 animate-pulse" />
                ) : (
                  <div
                    className={`h-3 rounded-full ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {loadingProgress ? (
                  <span className="flex items-center justify-center gap-1">
                    <FiLoader className="w-3 h-3 animate-spin" />
                    Loading
                  </span>
                ) : (
                  `${progress}%`
                )}
              </div>
            </div>

            {/* Team Avatars */}
            <div className="flex-shrink-0">
              <AvatarGroup users={teamMembers} max={4} size="sm" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* View/Edit Mode Toggle */}
              {canManageProject && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditMode(!isEditMode);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isEditMode
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEditMode ? <FiEye className="w-4 h-4" /> : <FiEdit3 className="w-4 h-4" />}
                </motion.button>
              )}

              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject(project);
                }}
                className={getGlassmorphicIconStyle('edit', 'list')}
                title="Edit Project"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 className="w-4 h-4" />
              </motion.button>
              
              {canManageProject && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignUsers(project);
                  }}
                  className={getGlassmorphicIconStyle('assign', 'list')}
                  title="Assign Users"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ display: 'flex' }} // Ensure button is displayed
                >
                  <FiUserPlus className="w-4 h-4" />
                </motion.button>
              )}
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewMembers(project);
                }}
                className={getGlassmorphicIconStyle('members', 'list')}
                title="View Members"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiUsers className="w-4 h-4" />
              </motion.button>
              
              {canManageProject && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className={getGlassmorphicIconStyle('delete', 'list')}
                  title="Delete Project"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrash2 className="w-4 h-4" />
                </motion.button>
              )}
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(project.id);
                }}
                className={getGlassmorphicIconStyle('favorite', 'list')}
                title="Add to Favorites"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiStar className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group relative"
      variants={cardVariants}
      whileHover="hover"
      onClick={() => navigate(`/projects/${project.id}?editMode=${isEditMode}`)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Card Header with Gradient - Reduced height */}
      <div className={`relative h-20 bg-gradient-to-br from-blue-500 to-indigo-600 p-4`}>
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30`}>
            <div className={`w-1.5 h-1.5 ${statusConfig.dot} rounded-full`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Quick Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              className="absolute top-3 right-3 flex gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
    
              {canManageProject && (
                <div className="relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProject(project);
                    }}
                    onMouseEnter={() => setHoveredIcon('edit')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={getGlassmorphicIconStyle('edit', 'grid')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      boxShadow: hoveredIcon === 'edit' ? '0 8px 25px rgba(59, 130, 246, 0.4)' : ''
                    }}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </motion.button>

                  {/* Tooltip for Edit */}
                  {hoveredIcon === 'edit' && (
                    <motion.div
                      className="absolute top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10 backdrop-blur-sm"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      Edit Project
                    </motion.div>
                  )}
                </div>
              )}
              
              {canManageProject && (
                <div className="relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignUsers(project);
                    }}
                    onMouseEnter={() => setHoveredIcon('assign')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={getGlassmorphicIconStyle('assign', 'grid')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      boxShadow: hoveredIcon === 'assign' ? '0 8px 25px rgba(147, 51, 234, 0.4)' : ''
                    }}
                  >
                    <FiUserPlus className="w-4 h-4" />
                  </motion.button>
                  
                  {/* Tooltip for Assign */}
                  {hoveredIcon === 'assign' && (
                    <motion.div
                      className="absolute top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10 backdrop-blur-sm"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      Assign Users
                    </motion.div>
                  )}
                </div>
              )}
              
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMembers(project);
                  }}
                  onMouseEnter={() => setHoveredIcon('members')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={getGlassmorphicIconStyle('members', 'grid')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    boxShadow: hoveredIcon === 'members' ? '0 8px 25px rgba(20, 184, 166, 0.4)' : ''
                  }}
                >
                  <FiUsers className="w-4 h-4" />
                </motion.button>
                
                {/* Tooltip for Members */}
                {hoveredIcon === 'members' && (
                  <motion.div
                    className="absolute top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10 backdrop-blur-sm"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    View Members
                  </motion.div>
                )}
              </div>
              
              {/* Favorite Button - Moved to action group */}
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(project.id);
                  }}
                  onMouseEnter={() => setHoveredIcon('favorite')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={getGlassmorphicIconStyle('favorite', 'grid')}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    boxShadow: hoveredIcon === 'favorite' ? '0 8px 25px rgba(251, 191, 36, 0.4)' : ''
                  }}
                >
                  <FiStar className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                </motion.button>
                
                {/* Tooltip for Favorite */}
                {hoveredIcon === 'favorite' && (
                  <motion.div
                    className="absolute top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10 backdrop-blur-sm"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  </motion.div>
                )}
              </div>
              
              {canManageProject && (
                <div className="relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    onMouseEnter={() => setHoveredIcon('delete')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={getGlassmorphicIconStyle('delete', 'grid')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      boxShadow: hoveredIcon === 'delete' ? '0 8px 25px rgba(239, 68, 68, 0.4)' : ''
                    }}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </motion.button>
                  
                  {/* Tooltip for Delete */}
                  {hoveredIcon === 'delete' && (
                    <motion.div
                      className="absolute top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10 backdrop-blur-sm"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      Delete Project
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-4">
        {/* Project Title */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
          {project.name}
        </h3>
        
        {/* Description */}
        <div
          className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: project.description || 'No description available'
          }}
        />

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span className="font-medium">Progress</span>
            <span className="font-bold">
              {loadingProgress ? (
                <span className="flex items-center gap-1">
                  <FiLoader className="w-3 h-3 animate-spin" />
                  Loading
                </span>
              ) : (
                `${progress}%`
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            {loadingProgress ? (
              <div className="h-2 rounded-full bg-gray-300 animate-pulse" />
            ) : (
              <motion.div
                className={`h-2 rounded-full ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiCalendar className="w-3 h-3" />
          <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
        </div>

        {/* Team Members */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FiUsers className="w-3 h-3" />
            <span>{teamMembers.length} members</span>
          </div>
          <AvatarGroup users={teamMembers} max={3} size="xs" />
        </div>

        {/* View/Edit Mode Toggle */}
        {canManageProject && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              Mode: {isEditMode ? 'Edit' : 'View'}
            </span>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditMode(!isEditMode);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                isEditMode
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
              }`}
              title={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isEditMode ? (
                <>
                  <FiEye className="w-3 h-3" />
                  View Mode
                </>
              ) : (
                <>
                  <FiEdit3 className="w-3 h-3" />
                  Edit Mode
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

    </motion.div>
  );
};

// ============================================
// MODAL COMPONENTS
// ============================================

// Enhanced Create/Edit Project Modal
const CreateEditProjectModal = ({
  isOpen,
  onClose,
  project,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [formProgress, setFormProgress] = useState(0);

  useEffect(() => {
    if (project) {
      setFormData({
        id: project.id,
        name: project.name || '',
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status || 'active'
      });
    } else {
      setFormData({
        id: null,
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'active'
      });
    }
    setError('');
    setFormProgress(0);
  }, [project, isOpen]);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const total = 5; // name, description, start_date, end_date, status

    if (formData.name.trim()) completed++;
    if (formData.description.trim()) completed++;
    if (formData.start_date) completed++;
    if (formData.end_date) completed++;
    if (formData.status) completed++;

    setFormProgress((completed / total) * 100);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    // Enhanced validation
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('End date must be after start date');
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError('Failed to save project');
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'active', label: 'Active', icon: FiZap, color: 'green', gradient: 'from-green-500 to-emerald-500' },
    { value: 'completed', label: 'Completed', icon: FiAward, color: 'blue', gradient: 'from-blue-500 to-indigo-500' },
    { value: 'archived', label: 'Archived', icon: FiBriefcase, color: 'gray', gradient: 'from-gray-500 to-slate-500' }
  ];

  const selectedStatus = statusOptions.find(s => s.value === formData.status) || statusOptions[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotateX: 15 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            duration: 0.4
          }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Enhanced Header with Gradient */}
          <motion.div
            className={`relative bg-gradient-to-br ${selectedStatus.gradient} p-8 text-white overflow-hidden`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30"
                    >
                      <selectedStatus.icon className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold">
                        {formData.id ? 'Edit Project' : 'Create New Project'}
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {formData.id ? 'Update project details' : 'Launch your next big idea'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  onClick={onClose}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-white/20 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${formProgress}%` }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="h-full bg-white rounded-full"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced Form Content */}
          <motion.div
            className="p-8 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name with Floating Label */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className={`relative ${focusedField === 'name' ? 'z-10' : ''}`}
              >
                <label className={`absolute left-4 transition-all duration-200 text-sm font-medium ${
                  formData.name ? '-top-2.5 text-xs bg-white px-2 text-blue-600' : 'top-4 text-gray-500'
                }`}>
                  Project Name *
                </label>
                <motion.input
                  type="text"
                  className={`w-full border-2 rounded-xl px-4 py-3 pt-6 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    focusedField === 'name' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-200'
                  }`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter project name"
                  required
                  whileFocus={{ scale: 1.01 }}
                />
                {formData.name && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-4 top-4"
                  >
                    <FiCheck className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
              </motion.div>

              {/* Description with Character Count */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                  {formData.description && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({formData.description.length}/500)
                    </span>
                  )}
                </label>
                <motion.textarea
                  className={`w-full border-2 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none ${
                    focusedField === 'description' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-200'
                  }`}
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, description: e.target.value });
                    }
                  }}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Describe your project's goals, objectives, and key features..."
                  rows={4}
                  whileFocus={{ scale: 1.01 }}
                />
                {/* Auto-expanding suggestions */}
                {formData.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-200"
                  >
                    <p className="text-xs text-blue-700">
                      💡 Tip: A clear description helps team members understand the project's purpose and scope.
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* Date Range with Visual Timeline */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FiCalendar className="inline mr-2" />
                    Start Date
                  </label>
                  <motion.input
                    type="date"
                    className={`w-full border-2 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      focusedField === 'start_date' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-200'
                    }`}
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    onFocus={() => setFocusedField('start_date')}
                    onBlur={() => setFocusedField(null)}
                    min={new Date().toISOString().split('T')[0]}
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FiTarget className="inline mr-2" />
                    End Date
                  </label>
                  <motion.input
                    type="date"
                    className={`w-full border-2 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      focusedField === 'end_date' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-200'
                    }`}
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    onFocus={() => setFocusedField('end_date')}
                    onBlur={() => setFocusedField(null)}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
              </motion.div>

              {/* Status with Visual Pills */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Project Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {statusOptions.map((status) => (
                    <motion.button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: status.value })}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.status === status.value
                          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${status.gradient} text-white`}>
                          <status.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{status.label}</span>
                      </div>
                      {formData.status === status.value && (
                        <motion.div
                          layoutId="statusCheck"
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Enhanced Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-700 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Action Buttons */}
              <motion.div
                className="flex gap-4 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  className={`flex-1 px-6 py-4 bg-gradient-to-r ${selectedStatus.gradient} text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={loading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <selectedStatus.icon className="w-4 h-4" />
                      <span>{formData.id ? 'Update Project' : 'Create Project'}</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Assignment Modal
const AssignmentModal = ({ 
  isOpen, 
  onClose, 
  project, 
  availableUsers, 
  onAssignUser,
  loading 
}) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [error, setError] = useState('');

  const handleAssign = async () => {
    if (!selectedUserId) {
      setError('Please select a user to assign');
      return;
    }
    
    try {
      await onAssignUser(selectedUserId);
      setSelectedUserId(null);
      setError('');
    } catch (err) {
      setError('Failed to assign user');
    }
  };

  if (!isOpen || !project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assign Users</h2>
              <p className="text-gray-600 mt-1">to {project.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Users</h3>
                <p className="text-gray-500">All users are already assigned to this project</p>
              </div>
            ) : (
              availableUsers.map((user) => (
                <motion.div
                  key={user.id}
                  className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedUserId === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedUserId(user.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                    {selectedUserId === user.id && (
                      <FiCheck className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedUserId || loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Assigning...
                </span>
              ) : (
                'Assign User'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Assigned Members Modal
const AssignedMembersModal = ({ 
  isOpen, 
  onClose, 
  project, 
  members, 
  onRemoveUser,
  loading 
}) => {
  if (!isOpen || !project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
              <p className="text-gray-600 mt-1">of {project.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Yet</h3>
                <p className="text-gray-500">Start by assigning users to this project</p>
              </div>
            ) : (
              members.map((member, index) => (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={member.users} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">{member.users.name}</p>
                      <p className="text-sm text-gray-500">{member.users.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role_in_project === 'manager' ? 'bg-purple-100 text-purple-800' :
                      member.role_in_project === 'admin' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {member.role_in_project}
                    </span>
                    <button
                      onClick={() => onRemoveUser(member.user_id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from project"
                    >
                      {loading ? (
                        <FiLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-auto px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// MAIN PROJECTS PAGE COMPONENT
// ============================================

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [favoriteProjects, setFavoriteProjects] = useState(new Set());
  const [recentProjects, setRecentProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [userProjectRoles, setUserProjectRoles] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modal states
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length
  };

  // Fetch current user and their role
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUser(null);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, team_id, manager_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setCurrentUser(data);
        setUserRole(data.role);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError('Failed to load user data');
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch projects assigned to current user
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔍 [DEBUG] Fetching projects for user:', user.id);

      // Fetch projects where the user is assigned, including is_favorite field
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments!inner(
            user_id,
            role_in_project,
            is_favorite
          ),
          created_by_user:users!projects_created_by_fkey(
            id,
            name
          )
        `)
        .eq('project_assignments.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ERROR] Fetching projects:', error);
        throw error;
      }

      console.log('📊 [DEBUG] Raw projects data:', data);

      // Process projects to include is_favorite status
      const processedProjects = (data || []).map(project => ({
        ...project,
        is_favorite: project.project_assignments[0]?.is_favorite || false
      }));

      console.log('✅ [DEBUG] Processed projects:', processedProjects.length, processedProjects.map(p => ({ id: p.id, name: p.name, role: p.project_assignments[0]?.role_in_project })));
      setProjects(processedProjects);
      
      // Set recent projects (first 5)
      setRecentProjects(processedProjects?.slice(0, 5) || []);
      
      // Fetch team members and user roles for each project
      const teamData = {};
      const userRolesData = {};
      for (const project of processedProjects) {
        try {
          const { data: members, error: membersError } = await supabase
            .from('project_assignments')
            .select(`
              user_id,
              role_in_project,
              is_favorite,
              users(
                id,
                name,
                avatar_url,
                email
              )
            `)
            .eq('project_id', project.id);
          
          console.log(`[DEBUG] Project ${project.id} members:`, members);
          
          if (!membersError && members) {
            teamData[project.id] = members.map(m => m.users).filter(Boolean);
            
            // Store current user's role in this project
            const currentUserAssignment = members.find(m => m.user_id === user.id);
            console.log(`[DEBUG] Current user assignment for project ${project.id}:`, currentUserAssignment);
            
            if (currentUserAssignment) {
              userRolesData[project.id] = currentUserAssignment.role_in_project;
              console.log(`[DEBUG] Set user role for project ${project.id}:`, currentUserAssignment.role_in_project);
            } else {
              console.log(`[DEBUG] No assignment found for user ${user.id} in project ${project.id}`);
            }
          }
        } catch (err) {
          console.error('Error fetching team members:', err);
          teamData[project.id] = [];
        }
      }
      console.log(`[DEBUG] Final userProjectRoles:`, userRolesData);
      setTeamMembers(teamData);
      setUserProjectRoles(userRolesData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Load projects when currentUser is available
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  // Toggle favorite project
  const toggleFavorite = async (projectId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Find the current project to get its current favorite status
      const currentProject = projects.find(p => p.id === projectId);
      if (!currentProject) {
        console.error('Project not found');
        return;
      }

      const newFavoriteStatus = !currentProject.is_favorite;
      
      // Update the is_favorite column in the project_assignments table
      const { error } = await supabase
        .from('project_assignments')
        .update({ is_favorite: newFavoriteStatus })
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating favorite status:', error);
        // Show error notification to user
        alert('Failed to update favorite status. Please try again.');
        return;
      }

      // Update local state to reflect the change
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? { ...project, is_favorite: newFavoriteStatus }
            : project
        )
      );

      // Also update the favoriteProjects set for backward compatibility
      setFavoriteProjects(prev => {
        const newSet = new Set(prev);
        if (newFavoriteStatus) {
          newSet.add(projectId);
        } else {
          newSet.delete(projectId);
        }
        return newSet;
      });

    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('An error occurred while updating favorite status. Please try again.');
    }
  };

  // Get favorite status from project data
  const isProjectFavorite = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.is_favorite || false;
  };

  // Check if user can manage project (has Manager or Admin main role)
  const canManageProject = (projectId) => {
    // Use the user's main role from the users table instead of project-specific roles
    const mainUserRole = currentUser?.role;
    
    // Debug logging
    console.log(`[DEBUG] canManageProject for project ${projectId}:`, {
      mainUserRole,
      currentUser: currentUser?.id,
      projectId,
      // Keep previous role info for comparison but don't use it for permission check
      previousProjectRole: userProjectRoles[projectId],
      userProjectRoles
    });
    
    if (!mainUserRole) {
      console.log(`[DEBUG] No main role found for current user`);
      return false;
    }
    
    // Check for case-insensitive match to handle potential case differences
    const normalizedRole = mainUserRole.toLowerCase();
    const isManager = normalizedRole === 'manager';
    const isAdmin = normalizedRole === 'admin';
    
    const canManage = isManager || isAdmin;
    console.log(`[DEBUG] User main role "${mainUserRole}" normalized to "${normalizedRole}" - Manager: ${isManager}, Admin: ${isAdmin}, CanManage: ${canManage}`);
    
    return canManage;
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle create/edit project
  const handleSaveProject = async (formData) => {
    setModalLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!currentCompany?.id) {
        throw new Error('Company information not available. Please refresh the page.');
      }

      const projectData = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        company_id: currentCompany.id,
      };

      if (formData.id) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Create new project
        projectData.created_by = user.id;

        // Insert project and get the created project ID
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Automatically assign the creator to the project with manager role
        if (newProject?.id) {
          console.log('🔧 [DEBUG] Auto-assigning creator to project:', {
            projectId: newProject.id,
            userId: user.id,
            projectName: projectData.name
          });

          const { data: assignmentData, error: assignmentError } = await supabase
            .from('project_assignments')
            .insert({
              project_id: newProject.id,
              user_id: user.id,
              company_id: currentCompany.id,
              role_in_project: 'manager',
              assigned_at: new Date().toISOString()
            })
            .select()
            .single();

          if (assignmentError) {
            console.error('❌ [ERROR] Auto-assigning creator to project:', assignmentError);
            // Don't throw error here, as project was created successfully
          } else {
            console.log('✅ [SUCCESS] Creator assigned to project:', assignmentData);

            // Add a small delay to ensure the database has processed the assignment
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          console.error('❌ [ERROR] No project ID returned from creation');
        }
      }

      // Send notification
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();
        
        if (userData?.team_id) {
          const message = formData.id 
            ? `Project "${formData.name}" has been updated.`
            : `New project "${formData.name}" has been created.`;
          
          await notifyProjectUpdate(
            formData.name,
            message,
            userData.team_id,
            user.id
          );
        }
      } catch (notificationError) {
        console.error('Error sending project notification:', notificationError);
      }

      console.log('🔄 [DEBUG] Refreshing projects after project creation...');
      await fetchProjects();
      console.log('✅ [DEBUG] Projects refreshed');
    } catch (err) {
      console.error('Error saving project:', err);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  // Fetch available users for assignment
  const fetchAvailableUsers = async (projectId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentUser) return;

      // Get all users in the same team
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('team_id', currentUser.team_id);
      
      if (usersError) throw usersError;

      // Get already assigned users for this project
      const { data: assignedUsers, error: assignedError } = await supabase
        .from('project_assignments')
        .select('user_id')
        .eq('project_id', projectId);
      
      if (assignedError) throw assignedError;

      // Filter out already assigned users
      const assignedUserIds = assignedUsers.map(assignment => assignment.user_id);
      const availableUsers = allUsers.filter(user => !assignedUserIds.includes(user.id));
      
      setAvailableUsers(availableUsers || []);
    } catch (err) {
      console.error('Error fetching available users:', err);
      setAvailableUsers([]);
    }
  };

  // Handle assign user to project
  const handleAssignUser = async (userId) => {
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: selectedProject.id,
          user_id: userId,
          role_in_project: 'member'
        });
      
      if (error) throw error;
      
      setShowAssignmentModal(false);
      await fetchProjects();
    } catch (err) {
      console.error('Error assigning user:', err);
      alert('Failed to assign user to project');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle remove user from project
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the project?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('project_id', selectedProject.id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      await fetchProjects();
      await fetchAssignedMembers(selectedProject.id);
    } catch (err) {
      console.error('Error removing user:', err);
      alert('Failed to remove user from project');
    }
  };

  // Fetch assigned members for a project
  const fetchAssignedMembers = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          user_id,
          role_in_project,
          users (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      setAssignedMembers(data || []);
    } catch (err) {
      console.error('Error fetching assigned members:', err);
      setAssignedMembers([]);
    }
  };

  // Modal handlers
  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowCreateEditModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowCreateEditModal(true);
  };

  const handleAssignUsers = (project) => {
    setSelectedProject(project);
    fetchAvailableUsers(project.id);
    setShowAssignmentModal(true);
  };

  const handleViewMembers = (project) => {
    setSelectedProject(project);
    fetchAssignedMembers(project.id);
    setShowMembersModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <motion.button
            onClick={fetchProjects}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Layout Container */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <ProjectsSidebar
          projects={projects}
          activeFilter={filterStatus}
          onProjectSelect={(project) => navigate(`/projects/${project.id}?editMode=false`)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          favoriteProjects={favoriteProjects}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <ProjectsHeader
            userRole={userRole}
            projects={projects}
            search={search}
            onSearchChange={setSearch}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRefresh={fetchProjects}
            loading={loading}
            stats={stats}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
            onCreateProject={handleCreateProject}
            navigate={navigate}
          />

          {/* Projects Content */}
          <motion.main
            className="flex-1 overflow-y-auto p-6"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {filteredProjects.length === 0 ? (
              <motion.div
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center max-w-md mx-auto">
                  <motion.div
                    className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <FiFolder className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No Projects Found</h3>
                  <p className="text-gray-600 mb-6">
                    {search ? 'Try adjusting your search terms' : 'You are not assigned to any projects yet.'}
                  </p>
                  {search && (
                    <motion.button
                      onClick={() => setSearch('')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear Search
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                  : "space-y-4"
                }
                variants={{
                  animate: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                initial="initial"
                animate="animate"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isProjectFavorite(project.id)}
                    viewMode={viewMode}
                    teamMembers={teamMembers[project.id] || []}
                    onEditProject={handleEditProject}
                    onDeleteProject={handleDeleteProject}
                    onAssignUsers={handleAssignUsers}
                    onViewMembers={handleViewMembers}
                    canManageProject={canManageProject(project.id)}
                  />
                ))}
              </motion.div>
            )}
          </motion.main>
        </div>
      </div>

      {/* Modals */}
      <CreateEditProjectModal
        isOpen={showCreateEditModal}
        onClose={() => setShowCreateEditModal(false)}
        project={selectedProject}
        onSave={handleSaveProject}
        loading={modalLoading}
      />

      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        project={selectedProject}
        availableUsers={availableUsers}
        onAssignUser={handleAssignUser}
        loading={modalLoading}
      />

      <AssignedMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        project={selectedProject}
        members={assignedMembers}
        onRemoveUser={handleRemoveUser}
        loading={modalLoading}
      />
    </div>
  );
}
