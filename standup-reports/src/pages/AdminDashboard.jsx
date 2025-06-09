import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiUsers, FiBriefcase } from 'react-icons/fi';
import ManagerTeamAssignment from '../components/ManagerTeamAssignment';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 text-white overflow-hidden shadow-lg"
        variants={itemVariants}
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display mb-2 flex items-center">
            <FiShield className="mr-3" />
            Admin Dashboard
          </h1>
          <p className="text-red-100 max-w-xl">
            Full administrative control over team and manager assignments.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ManagerTeamAssignment />
      </motion.div>
    </motion.div>
  );
} 