import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFolder, FiUsers, FiCalendar, FiSearch, FiGrid, FiList, FiStar, 
  FiArrowLeft, FiMaximize2, FiMinimize2, FiBookOpen, FiFileText, 
  FiActivity, FiTarget, FiClock, FiUser, FiChevronDown, FiChevronUp, 
  FiChevronRight, FiX, FiRefreshCw, FiLayers, FiEye, FiAlertCircle
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';

// Enhanced Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }
};

// Enhanced Header Component
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
  loading
}) => {
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length
  };

  return (
    <motion.div
      className="relative mb-6"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Stunning Gradient Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.3),transparent_50%)]" />
        </div>

        {/* Floating Elements */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ 
              y: [0, -20, 0], 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Enhanced Left Section */}
            <div className="flex items-center gap-6">
              <motion.div
                className="relative p-6 bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl"
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ duration: 0.3 }}
              >
                <FiFolder className="w-12 h-12 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-3xl blur-xl" />
              </motion.div>

              <div>
                <motion.h1
                  className="text-3xl lg:text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  My Projects
                </motion.h1>
                <motion.p
                  className="text-blue-100/90 text-lg lg:text-xl font-medium"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  View and explore your assigned project workspace
                </motion.p>
              </div>
            </div>
            
            {/* Enhanced Stats Dashboard */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {[
                { label: 'Total', value: stats.total, icon: FiTarget, color: 'text-blue-300', bg: 'bg-blue-500/20' },
                { label: 'Active', value: stats.active, icon: FiActivity, color: 'text-green-300', bg: 'bg-green-500/20' },
                { label: 'Completed', value: stats.completed, icon: FiFileText, color: 'text-purple-300', bg: 'bg-purple-500/20' },
                { label: 'Archived', value: stats.archived, icon: FiFolder, color: 'text-orange-300', bg: 'bg-orange-500/20' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-100/80 font-medium uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
              </div>
            </div>
          </div>

      {/* Enhanced Control Panel */}
      <motion.div
        className="mt-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Enhanced Search Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="relative w-full sm:w-96">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500"
              />
              {search && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            
            {/* Enhanced Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All', count: stats.total, color: 'indigo' },
                { key: 'active', label: 'Active', count: stats.active, color: 'green' },
                { key: 'completed', label: 'Completed', count: stats.completed, color: 'blue' },
                { key: 'archived', label: 'Archived', count: stats.archived, color: 'gray' }
              ].map((filter) => (
                <motion.button
                  key={filter.key}
                  onClick={() => onFilterChange(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    filterStatus === filter.key
                      ? `bg-${filter.color}-100 text-${filter.color}-700 border border-${filter.color}-200 shadow-sm`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm font-medium">{filter.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    filterStatus === filter.key
                      ? `bg-${filter.color}-200 text-${filter.color}-800`
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Enhanced Action Section */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                onClick={() => onViewModeChange('grid')}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-indigo-600 shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                <FiGrid size={18} />
                </button>
                <button
                onClick={() => onViewModeChange('list')}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                <FiList size={18} />
                </button>
              </div>

            {/* Refresh Button */}
            <motion.button
              onClick={onRefresh}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh projects"
            >
              <FiRefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
            </div>
          </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Project Card Component
const ProjectCard = ({ 
  project, 
  onView, 
  onToggleFavorite, 
  isFavorite, 
  viewMode = 'grid' 
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          text: 'text-green-800',
          border: 'border-green-200',
          dot: 'bg-green-500'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-cyan-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'archived':
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
            <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 p-4 cursor-pointer"
        variants={cardVariants}
        whileHover={{ scale: 1.005, y: -2 }}
        onClick={() => onView(project)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            {/* Project Icon & Info */}
            <div className="flex items-center gap-4">
              <motion.div
                className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FiFolder className="w-6 h-6" />
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                  <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                    <div className={`w-2 h-2 ${statusConfig.dot} rounded-full`} />
                    {project.status}
                  </span>
            <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(project.id);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <FiStar size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
                <p className="text-gray-600 mb-3 line-clamp-2">{project.description || 'No description available'}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                  </span>
                  <span className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    {project.project_assignments?.length || 0} members
                  </span>
                  {project.created_by_user && (
                    <span className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      {project.created_by_user.name}
                    </span>
                  )}
          </div>
              </div>
            </div>
          </div>

          {/* View Action */}
          <div className="flex items-center">
              <motion.div
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEye className="w-4 h-4" />
              View Project
            </motion.div>
                      </div>
        </div>
      </motion.div>
    );
  }

  return (
          <motion.div
        className="group bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
        variants={cardVariants}
        whileHover={{ scale: 1.02, y: -4 }}
        onClick={() => onView(project)}
      >
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full translate-y-8 -translate-x-8" />
      </div>

      {/* Status Indicator */}
      <motion.div
        className={`absolute top-4 left-4 w-3 h-3 ${statusConfig.dot} rounded-full shadow-lg`}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8] 
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

              <div className="relative p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md text-white"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FiFolder className="w-4 h-4" />
              </motion.div>
              <h3 className="text-base font-bold text-gray-900 line-clamp-1">{project.name}</h3>
                      </div>
            <p className="text-gray-600 text-xs line-clamp-2 mb-2">{project.description || 'No description available'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                onToggleFavorite(project.id);
                        }}
              className={`p-2 rounded-full transition-colors ${
                isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
              <FiStar size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
            <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
              <div className={`w-2 h-2 ${statusConfig.dot} rounded-full`} />
                        {project.status}
                      </span>
                    </div>
                  </div>

        {/* Project Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiCalendar className="w-3 h-3 text-gray-400" />
            <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                    </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <FiUsers className="w-3 h-3 text-gray-400" />
              <span>{project.project_assignments?.length || 0} members</span>
                    </div>
            {project.created_by_user && (
              <span className="text-xs text-gray-500">by {project.created_by_user.name}</span>
            )}
                  </div>
                </div>

        {/* View Action */}
        <div className="flex pt-3 border-t border-gray-100">
          <motion.div
            className="flex-1 py-2 px-3 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-xs text-center flex items-center justify-center gap-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiEye className="w-3 h-3" />
            View Content
              </motion.div>
          </div>
      </div>

      {/* Hover Effect Overlay */}
          <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />
    </motion.div>
  );
};

// Enhanced Project Detail Modal with Proper Content Display
const ProjectDetailModal = ({ 
  project, 
  sections, 
  sectionsLoading, 
  expandedSections, 
  onToggleSection, 
  selectedTopic, 
  topicContent, 
  topicContentLoading, 
  onSelectTopic, 
  onClose, 
  fullScreen, 
  onToggleFullScreen 
}) => {
  if (!project) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
      onClick={onClose}
          >
            <motion.div
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
          fullScreen ? 'w-full h-full' : 'w-full max-w-7xl max-h-[95vh]'
        }`}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8">
                <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <FiFolder className="w-8 h-8" />
              </motion.div>
              
                    <div>
                <motion.h2 
                  className="text-3xl font-bold mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {project.name}
                </motion.h2>
                <p className="text-indigo-100 text-lg">{project.description}</p>
                <div className="flex items-center gap-6 mt-3 text-sm text-indigo-100">
                  <span className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} - 
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    {project.project_assignments?.length || 0} members
                  </span>
                  {project.created_by_user && (
                    <span className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      Created by {project.created_by_user.name}
                    </span>
                  )}
                    </div>
                  </div>
                </div>
                
            <div className="flex items-center gap-3">
              <motion.button
                onClick={onToggleFullScreen}
                className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {fullScreen ? <FiMinimize2 className="w-6 h-6" /> : <FiMaximize2 className="w-6 h-6" />}
              </motion.button>
              <motion.button 
                onClick={onClose} 
                className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-6 h-6" />
              </motion.button>
                    </div>
                </div>
              </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sections Sidebar */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiLayers className="text-indigo-600" />
                Project Sections
              </h3>
              
                {sectionsLoading ? (
                <div className="flex justify-center py-8">
                    <motion.div
                    className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-12">
                  <FiBookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No sections available</p>
                  </div>
                ) : (
                <div className="space-y-3">
                    {sections.map((section) => (
                      <motion.div
                        key={section.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onToggleSection(section.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                            <FiBookOpen className="text-indigo-600 w-4 h-4" />
                            </div>
                            <div>
                            <h4 className="font-semibold text-gray-900">{section.name}</h4>
                            <p className="text-sm text-gray-600">{section.description}</p>
                            </div>
                          </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                            {section.project_topics?.length || 0}
                            </span>
                            {expandedSections[section.id] ? <FiChevronUp /> : <FiChevronDown />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedSections[section.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                            <div className="px-4 pb-4">
                                {section.project_topics?.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No topics available</p>
                                ) : (
                                <div className="space-y-2">
                                    {section.project_topics?.map((topic) => (
                                    <motion.button
                                        key={topic.id}
                                      onClick={() => onSelectTopic(topic)}
                                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                                        selectedTopic?.id === topic.id
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                                      }`}
                                        whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <FiFileText className="w-4 h-4" />
                                        <div>
                                          <div className="font-medium">{topic.name}</div>
                                          {topic.description && (
                                            <div className="text-sm opacity-80">{topic.description}</div>
                                          )}
                                          {topic.project_topic_content && topic.project_topic_content.length > 0 && (
                                            <div className="text-xs text-green-600 mt-1">
                                              ✓ Has content
                                            </div>
                                          )}
                                            </div>
                                          </div>
                                    </motion.button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
                    </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {selectedTopic ? (
                    <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedTopic.name}</h3>
                    {selectedTopic.description && (
                      <p className="text-gray-600">{selectedTopic.description}</p>
                    )}
              </div>

                {topicContentLoading ? (
                    <div className="flex justify-center py-12">
                    <motion.div
                        className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  ) : topicContent && topicContent.length > 0 ? (
                    <div className="space-y-6">
                      {topicContent.map((content, index) => (
                        <motion.div
                          key={content.id}
                          className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="mb-6">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{content.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FiUser className="w-4 h-4" />
                                {content.created_by?.name || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiClock className="w-4 h-4" />
                                {new Date(content.created_at).toLocaleDateString()}
                              </span>
                              {content.updated_at !== content.created_at && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <FiFileText className="w-4 h-4" />
                                  Updated {new Date(content.updated_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                      </div>
                      <div className="prose prose-lg max-w-none">
                            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {content.content}
                        </div>
                      </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Available</h3>
                    <p className="text-gray-600">This topic doesn't have any content yet.</p>
                  </div>
                )}
              </div>
              ) : (
                <div className="text-center py-16">
                  <motion.div
                    className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <FiBookOpen className="w-10 h-10 text-indigo-600" />
            </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Topic</h3>
                  <p className="text-gray-600">Choose a topic from the sidebar to view its content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
          </motion.div>
    </motion.div>
  );
};

// Main Enhanced ProjectsPage Component
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicContent, setTopicContent] = useState([]);
  const [topicContentLoading, setTopicContentLoading] = useState(false);
  const [favoriteProjects, setFavoriteProjects] = useState(new Set());
  const [fullScreenContent, setFullScreenContent] = useState(true);  // Default to full screen for better viewing

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

      // Fetch projects where the user is assigned
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments!inner(
            user_id,
            role_in_project
          ),
          created_by_user:users!projects_created_by_fkey(
            id,
            name
          )
        `)
        .eq('project_assignments.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
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

  // Fetch sections for selected project
  const fetchSections = async (projectId) => {
    setSectionsLoading(true);
    setSections([]);
    setExpandedSections({});
    setSelectedTopic(null);
    setTopicContent([]);
    
    try {
      const { data, error } = await supabase
        .from('project_sections')
        .select(`
          *,
          project_topics(
            *,
            project_topic_content(
              id,
              title,
              content,
              created_at,
              updated_at,
              created_by(name)
            )
          )
        `)
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (error) throw error;
      setSections(data || []);

      // Auto-expand first section
      if (data && data.length > 0) {
        setExpandedSections({ [data[0].id]: true });
        // Auto-select first topic of the first section if available
        if (data[0].project_topics?.length > 0) {
          fetchTopicContent(data[0].project_topics[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setSectionsLoading(false);
    }
  };

  // Fetch topic content - Get all content for the topic
  const fetchTopicContent = async (topic) => {
    setTopicContentLoading(true);
    setSelectedTopic(topic);
    try {
      const { data, error } = await supabase
        .from('project_topic_content')
        .select(`
          *,
          created_by(id, name)
        `)
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopicContent(data || []);
    } catch (err) {
      console.error('Error fetching topic content:', err);
      setTopicContent([]);
    } finally {
      setTopicContentLoading(false);
    }
  };

  // Auto-fetch sections when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchSections(selectedProject.id);
    }
  }, [selectedProject]);

  // Toggle favorite project
  const toggleFavorite = (projectId) => {
    setFavoriteProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-6"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Projects</h3>
          <p className="text-gray-600">Please wait while we fetch your assigned projects...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
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
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
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
        />

        {/* Enhanced Content */}
        <div className="relative h-[calc(100vh-300px)] overflow-y-auto">
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
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
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
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" 
                : "space-y-4"
              }
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={setSelectedProject}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={favoriteProjects.has(project.id)}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            sections={sections}
            sectionsLoading={sectionsLoading}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            selectedTopic={selectedTopic}
            topicContent={topicContent}
            topicContentLoading={topicContentLoading}
            onSelectTopic={fetchTopicContent}
            onClose={() => setSelectedProject(null)}
            fullScreen={fullScreenContent}
            onToggleFullScreen={() => setFullScreenContent(!fullScreenContent)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
