import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiUser, FiUsers, FiCalendar, FiClock,
  FiChevronRight, FiCheckCircle, FiBriefcase,
  FiFilter
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';

const UserListModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  users = [],
  type = 'onLeave', // 'onLeave', 'available'
  date = null
}) => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  // --- Design Configuration ---
  const THEME = {
    onLeave: {
      gradient: 'from-orange-400 to-red-500',
      bg_light: 'bg-orange-50',
      text_light: 'text-orange-600',
      border: 'border-orange-100',
      icon: FiClock,
      badge: 'On Leave'
    },
    available: {
      gradient: 'from-emerald-400 to-teal-500',
      bg_light: 'bg-emerald-50',
      text_light: 'text-emerald-600',
      border: 'border-emerald-100',
      icon: FiCheckCircle,
      badge: 'Available'
    }
  };

  const currentTheme = THEME[type] || THEME.available;
  const Icon = currentTheme.icon;

  // --- Filtering ---
  const filteredUsers = users.filter(user => {
    // Basic validity check
    if (!user || !user.id || !user.name) return false;
    // Company check
    if (currentCompany?.id && user.company_id && user.company_id !== currentCompany.id) return false;
    return true;
  });

  const handleUserClick = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header Section - Compact */}
          <div className="relative px-6 py-5 overflow-hidden border-b border-gray-100">
            {/* Subtle background wash instead of blobs */}
            <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.gradient} opacity-[0.08]`} />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 ${currentTheme.text_light}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
                  <p className="text-gray-500 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiUsers className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No users found</h3>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredUsers.map((user, index) => (
                  <motion.button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group group text-left"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover shadow-sm bg-gray-100"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${currentTheme.bg_light} ${currentTheme.text_light}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${currentTheme.bg_light} flex items-center justify-center`}>
                        <Icon className={`w-2 h-2 ${currentTheme.text_light}`} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {user.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${currentTheme.bg_light} ${currentTheme.text_light}`}>
                          {currentTheme.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <span className="truncate">{user.role || 'Team Member'}</span>
                        {user.team_name && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1 truncate">
                              <FiBriefcase className="w-3 h-3" /> {user.team_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <FiChevronRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-medium px-6">
            <span>{filteredUsers.length} people</span>
            <span className="flex items-center gap-1">
              <FiFilter className="w-3 h-3" />
              Viewing {type === 'onLeave' ? 'On Leave' : 'Available'}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserListModal;