import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiUsers, FiCalendar, FiClock, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';

const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

const UserListModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  users = [],
  type = 'onLeave', // 'onLeave' or 'available'
  date = null
}) => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  // Filter users by company and remove null/undefined users
  const filteredUsers = users.filter(user =>
    user &&
    user.id &&
    user.name &&
    (!currentCompany?.id || user.company_id === currentCompany?.id)
  );

  if (!isOpen) return null;

  const getStatusColor = (type) => {
    return type === 'onLeave' 
      ? 'bg-orange-100 text-orange-800'
      : 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (type) => {
    return type === 'onLeave' 
      ? <FiClock className="w-4 h-4" />
      : <FiUser className="w-4 h-4" />;
  };

  const handleUserClick = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 ${type === 'onLeave' ? 'bg-orange-50' : 'bg-green-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiUsers className={`w-5 h-5 ${type === 'onLeave' ? 'text-orange-500' : 'text-green-500'}`} />
                  {title}
                </h3>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No users to display</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id || index}
                    className="flex items-center justify-between text-sm p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleUserClick(user.id)}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-primary-200 mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-3 text-xs">
                          <FiUser className="w-4 h-4" />
                          <span className="ml-1">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                    <div className="flex items-center">
                      <FiChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserListModal;