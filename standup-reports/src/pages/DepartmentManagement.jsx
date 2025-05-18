import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiUserCheck, FiUserPlus, FiChevronDown, FiBriefcase, FiGrid } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DepartmentDirectory from '../components/DepartmentDirectory';
import DirectorAssignment from '../components/DirectorAssignment';
import DepartmentTeamAssignment from '../components/DepartmentTeamAssignment';

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

export default function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState('department-directory');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Fetch current user on component mount
  useEffect(() => {
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching current user:', error.message);
        setLoading(false);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Handle URL parameters for tab selection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['department-directory', 'director-assignment', 'department-teams'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/department-management?tab=${tabId}`, { replace: true });
    setDropdownOpen(false);
  };
  
  const tabs = [
    { id: 'department-directory', label: 'Department Directory', icon: <FiBriefcase /> },
    { id: 'director-assignment', label: 'Director Assignment', icon: <FiUserCheck /> },
    { id: 'department-teams', label: 'Department Teams', icon: <FiGrid /> }
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // Check if user is either a director or admin (for now we'll just check if they're a director)
  const isAuthorized = currentUser && currentUser.role === 'director';
  
  if (!isAuthorized) {
    return (
      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 max-w-3xl mx-auto">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FiBriefcase className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Director Access Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You need director privileges to access this department management feature. Please contact your administrator if you believe you should have access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      className="space-y-6 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiBriefcase className="text-primary-500" />
            Department Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's departments, directors, and team assignments.
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
          {activeTab === 'department-directory' && (
            <motion.div
              key="department-directory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Department Directory</h2>
                <p className="text-gray-600 mb-4">
                  View, create, and manage all departments in your organization.
                </p>
                <DepartmentDirectory />
              </div>
            </motion.div>
          )}
          
          {activeTab === 'director-assignment' && (
            <motion.div
              key="director-assignment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Director Assignment</h2>
                <p className="text-gray-600 mb-4">
                  Assign or promote users to director roles for specific departments.
                </p>
                <DirectorAssignment />
              </div>
            </motion.div>
          )}
          
          {activeTab === 'department-teams' && (
            <motion.div
              key="department-teams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Department Teams</h2>
                <p className="text-gray-600 mb-4">
                  Assign teams to specific departments to organize your company structure.
                </p>
                <DepartmentTeamAssignment />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 