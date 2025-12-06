import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, parseISO, isWithinInterval, isSameMonth } from 'date-fns';
import { FiUser, FiUsers, FiCalendar, FiCheck, FiClock, FiX, FiSearch, FiFilter } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const statusColors = {
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <FiCheck className="text-green-500 mr-2" />
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: <FiClock className="text-yellow-500 mr-2" />
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <FiX className="text-red-500 mr-2" />
  }
};

const TeamLeaveOverview = ({ users, leaveData, currentMonth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userLeaveMap, setUserLeaveMap] = useState({});

  // Process leave data by user
  useEffect(() => {
    if (!leaveData || !users) return;

    const leaveByUser = {};

    // Initialize all users
    users.forEach(user => {
      leaveByUser[user.id] = {
        userData: user,
        leaves: []
      };
    });

    // Add leave data
    (leaveData || []).forEach(leave => {
      if (!leave.users || !leave.users.id) return;

      const userId = leave.users.id;

      if (leaveByUser[userId]) {
        leaveByUser[userId].leaves.push(leave);
      }
    });

    setUserLeaveMap(leaveByUser);
  }, [leaveData, users]);

  // Filter users based on search and status
  const filteredUsers = Object.values(userLeaveMap).filter(userLeave => {
    // Filter by search term
    const nameMatch = userLeave.userData.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    if (statusFilter !== 'all') {
      return nameMatch && userLeave.leaves.some(leave => leave.status === statusFilter);
    }

    return nameMatch;
  });

  // Check if a leave is in the current month
  const isLeaveInCurrentMonth = (leave) => {
    const startDate = parseISO(leave.start_date);
    const endDate = parseISO(leave.end_date);

    return (
      isSameMonth(startDate, currentMonth) ||
      isSameMonth(endDate, currentMonth) ||
      (startDate < currentMonth && endDate > currentMonth)
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiUsers className="mr-2 text-primary-500" />
          Team Leave Overview
        </h2>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex flex-wrap gap-3">
          {/* Search box */}
          <div className="relative flex-grow max-w-sm">
            <input
              type="text"
              placeholder="Search team member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-10 pr-8 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Team list */}
      <motion.div
        className="p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map(userLeave => (
              <motion.div
                key={userLeave.userData.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
                variants={itemVariants}
              >
                {/* User header */}
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-lg mr-3">
                      {userLeave.userData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{userLeave.userData.name}</h3>
                      <div className="text-xs text-gray-500">
                        {userLeave.leaves.filter(isLeaveInCurrentMonth).length} leave requests for {format(currentMonth, 'MMMM')}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${userLeave.leaves.some(leave => leave.status === 'approved' && isLeaveInCurrentMonth(leave))
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      <FiCalendar className="mr-1" />
                      {userLeave.leaves.filter(leave => leave.status === 'approved' && isLeaveInCurrentMonth(leave)).length} approved
                    </span>
                  </div>
                </div>

                {/* Leave list */}
                <div className="p-4">
                  {userLeave.leaves.filter(isLeaveInCurrentMonth).length > 0 ? (
                    <div className="space-y-3">
                      {userLeave.leaves
                        .filter(isLeaveInCurrentMonth)
                        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                        .map(leave => (
                          <div
                            key={leave.id}
                            className={`px-4 py-3 rounded-lg ${statusColors[leave.status]?.bg || 'bg-gray-100'}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className={`text-sm font-medium ${statusColors[leave.status]?.text || 'text-gray-700'} flex items-center`}>
                                {statusColors[leave.status]?.icon}
                                {leave.status === 'approved' ? 'Approved' : leave.status === 'pending' ? 'Pending Approval' : 'Rejected'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {differenceInDays(parseISO(leave.end_date), parseISO(leave.start_date)) + 1} days
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                {format(parseISO(leave.start_date), 'MMM d')} - {format(parseISO(leave.end_date), 'MMM d, yyyy')}
                              </div>
                              {leave.reason && (
                                <div className="text-xs truncate max-w-[200px] text-gray-500">
                                  {leave.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No leave requests for {format(currentMonth, 'MMMM')}.
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiUser className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">No team members found</h3>
            <p className="text-sm">
              Try adjusting your search or filter settings.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeamLeaveOverview; 