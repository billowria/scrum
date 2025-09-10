import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiUsers, FiChevronRight } from 'react-icons/fi';

const ProfileNavigation = ({ user, onProfileClick }) => {
  const navigate = useNavigate();

  const handleMyProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const handleTeamProfilesClick = () => {
    if (user?.role === 'manager') {
      navigate('/manager/profiles');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FiUser className="w-5 h-5 text-indigo-600" />
          Profile Management
        </h3>
      </div>
      
      <div className="p-2">
        <motion.button
          onClick={handleMyProfileClick}
          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <FiUser className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-800">My Profile</span>
          </div>
          <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
        </motion.button>
        
        <motion.button
          onClick={handleTeamProfilesClick}
          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <FiUsers className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-800">
              {user?.role === 'manager' ? 'Team Profiles' : 'My Team'}
            </span>
          </div>
          <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileNavigation;