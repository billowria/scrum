import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { FiUser, FiUsers, FiChevronRight, FiMail, FiPhone, FiLinkedin, FiCalendar, FiBriefcase, FiX } from 'react-icons/fi';
import UserProfileModal from './UserProfileModal';

const UserProfilesWidget = ({ userTeamId, currentUser }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (userTeamId) {
      fetchTeamMembers();
    }
  }, [userTeamId]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      // Fetch team members with their profiles
      const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('team_id', userTeamId)
        .order('name');

      if (error) throw error;
      
      // Separate current user from team members
      const currentUserData = data.find(user => user.id === currentUser.id);
      const otherMembers = data.filter(user => user.id !== currentUser.id);
      
      // Put current user first, then others
      const orderedMembers = currentUserData 
        ? [currentUserData, ...otherMembers] 
        : otherMembers;
        
      setTeamMembers(orderedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FiUsers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-500">Loading team information...</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FiUsers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-500">{teamMembers.length} people in your team</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
              member.id === currentUser.id ? 'bg-indigo-50 border border-indigo-100' : 'border border-gray-100'
            }`}
            onClick={() => handleUserClick(member)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-medium shadow">
                {member.name.charAt(0)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 truncate">{member.name}</h4>
                {member.id === currentUser.id && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                    You
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{member.job_title || member.role}</p>
            </div>
            
            <div className="flex items-center gap-1">
              {member.job_title && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {member.job_title}
                </span>
              )}
              <FiChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
        currentUser={currentUser}
        onUpdate={fetchTeamMembers}
      />
    </div>
  );
};

export default UserProfilesWidget;