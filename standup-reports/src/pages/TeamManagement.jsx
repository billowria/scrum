import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiUserCheck, FiUserPlus, FiChevronDown } from 'react-icons/fi';
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

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState('staff-oversight');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle URL parameters for tab selection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['staff-oversight', 'team-assignment', 'manager-delegation'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/team-management?tab=${tabId}`, { replace: true });
    setDropdownOpen(false);
  };
  
  const tabs = [
    { id: 'staff-oversight', label: 'Staff Oversight', icon: <FiUsers /> },
    { id: 'team-assignment', label: 'Team Assignment', icon: <FiUserPlus /> },
    { id: 'manager-delegation', label: 'Manager Delegation', icon: <FiUserCheck /> }
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
        
        {/* Mobile dropdown for tabs */}
        <div className="relative md:hidden">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="flex items-center">
              {tabs.find(tab => tab.id === activeTab)?.icon}
              <span className="ml-2">{tabs.find(tab => tab.id === activeTab)?.label}</span>
            </span>
            <FiChevronDown className={`ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="py-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab.icon}
                      <span className="ml-2">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Desktop tabs */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {activeTab === 'staff-oversight' && (
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
          
          {activeTab === 'team-assignment' && (
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
                {/* We'll add the team assignment component here */}
                <TeamAssignment />
              </div>
            </motion.div>
          )}
          
          {activeTab === 'manager-delegation' && (
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
                {/* We'll add the manager delegation component here */}
                <ManagerDelegation />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
