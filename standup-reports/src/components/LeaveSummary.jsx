import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { FiCalendar, FiUser, FiInfo, FiCheck, FiX, FiClock } from 'react-icons/fi';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.1,
      type: 'spring', 
      stiffness: 300, 
      damping: 24 
    }
  })
};

const LeaveSummary = ({ leaveData, currentMonth }) => {
  // Sort leave data by start date
  const sortedLeaveData = [...leaveData].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );
  
  // Group leave data by status
  const upcomingLeaves = sortedLeaveData.filter(leave => 
    new Date(leave.start_date) >= new Date() && leave.status !== 'rejected'
  );
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <FiCheck className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FiCalendar className="text-primary-600" />
        Upcoming Leaves
      </h3>
      
      {upcomingLeaves.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No upcoming leaves for this month
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingLeaves.map((leave, index) => {
            const startDate = parseISO(leave.start_date);
            const endDate = parseISO(leave.end_date);
            const duration = differenceInDays(endDate, startDate) + 1;
            
            return (
              <motion.div
                key={leave.id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      <FiUser />
                    </div>
                    <span className="font-medium">{leave.users?.name || 'Unknown User'}</span>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(leave.status)}`}>
                    {getStatusIcon(leave.status)}
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </div>
                </div>
                
                <div className="ml-10 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="text-primary-500" />
                    <span>
                      {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                      {duration} {duration === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  
                  {leave.reason && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <FiInfo className="text-primary-500 mt-0.5" />
                      <span className="text-gray-700">{leave.reason}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveSummary;
