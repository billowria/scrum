import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiUserCheck, FiUserPlus } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagerAssignment from '../components/ManagerAssignment';
import TeamAssignment from '../components/TeamAssignment';
import ManagerDelegation from '../components/ManagerDelegation';


// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function TeamManagement({ activeSubTab = 'staff-oversight', setActiveSubTab }) {
  const handleTabChange = (tabId) => {
    if (setActiveSubTab) setActiveSubTab(tabId);
  };

  const tabs = [
    { id: 'staff-oversight', label: 'Staff Oversight', icon: <FiUsers /> },
    { id: 'team-assignment', label: 'Team Assignment', icon: <FiUserPlus /> },
    { id: 'manager-delegation', label: 'Manager Delegation', icon: <FiUserCheck /> },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiUsers className="text-primary-500" />
            Workforce Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your team members, assignments, and delegations.
          </p>
        </div>
      </motion.div>

            <div className="relative bg-gray-100 p-1.5 rounded-xl flex items-center justify-center shadow-inner">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`relative z-10 flex items-center gap-2 py-2.5 px-6 rounded-lg transition-colors duration-300 text-sm font-medium ${activeSubTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {activeSubTab === tab.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-md"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative">{tab.icon}</span>
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {activeSubTab === 'staff-oversight' && (
            <motion.div
              key="staff-overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Staff Overview</h2>
                <p className="text-gray-600 mb-4">
                  View and manage all team members in your organization.
                </p>
                <ManagerAssignment />
              </div>
            </motion.div>
          )}

          {activeSubTab === 'team-assignment' && (
            <motion.div
              key="team-assignment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Team Assignment</h2>
                <p className="text-gray-600 mb-4">
                  Assign team members to specific teams or projects.
                </p>
                <TeamAssignment />
              </div>
            </motion.div>
          )}

          {activeSubTab === 'manager-delegation' && (
            <motion.div
              key="manager-delegation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Manager Delegation</h2>
                <p className="text-gray-600 mb-4">
                  Assign managers to oversee specific team members.
                </p>
                <ManagerDelegation />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
