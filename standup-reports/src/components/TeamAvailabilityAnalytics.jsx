import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay, isSameMonth, subMonths, addMonths } from 'date-fns';
import { FiCalendar, FiUsers, FiArrowDown, FiArrowUp, FiChevronLeft, FiChevronRight, FiBarChart2, FiPieChart } from 'react-icons/fi';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const chartVariants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: chart => ({
    opacity: 1,
    scaleY: 1,
    transition: { 
      duration: 0.5,
      delay: chart * 0.1
    }
  })
};

const TeamAvailabilityAnalytics = ({ 
  teamAvailability, 
  users,
  leaveData,
  currentMonth
}) => {
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  
  // Calculate overall availability for the month
  const calculateOverallAvailability = () => {
    if (!teamAvailability || Object.keys(teamAvailability).length === 0) {
      return { percentage: 0, status: 'low' };
    }
    
    const totalDays = Object.keys(teamAvailability).length;
    let availabilitySum = 0;
    
    Object.values(teamAvailability).forEach(day => {
      availabilitySum += day.availablePercentage;
    });
    
    const averageAvailability = Math.round(availabilitySum / totalDays);
    
    let status = 'high';
    if (averageAvailability < 70) status = 'medium';
    if (averageAvailability < 50) status = 'low';
    
    return { percentage: averageAvailability, status };
  };
  
  // Calculate busiest days
  const calculateBusiestDays = () => {
    if (!teamAvailability || Object.keys(teamAvailability).length === 0) {
      return [];
    }
    
    const sortedDays = Object.entries(teamAvailability)
      .map(([date, data]) => ({ date, availablePercentage: data.availablePercentage }))
      .sort((a, b) => a.availablePercentage - b.availablePercentage)
      .slice(0, 5);
    
    return sortedDays;
  };
  
  // Calculate most frequent users on leave
  const calculateFrequentLeaves = () => {
    if (!leaveData || leaveData.length === 0) {
      return [];
    }
    
    const leavesByUser = {};
    
    leaveData.forEach(leave => {
      if (!leave.users || !leave.users.id) return;
      
      const userId = leave.users.id;
      const userName = leave.users.name || 'Unknown User';
      
      if (!leavesByUser[userId]) {
        leavesByUser[userId] = { id: userId, name: userName, count: 0 };
      }
      
      leavesByUser[userId].count++;
    });
    
    return Object.values(leavesByUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };
  
  // Statistics
  const overallAvailability = calculateOverallAvailability();
  const busiestDays = calculateBusiestDays();
  const frequentLeaves = calculateFrequentLeaves();
  
  // Get low availability days percentage
  const getLowAvailabilityPercentage = () => {
    if (!teamAvailability || Object.keys(teamAvailability).length === 0) {
      return 0;
    }
    
    const totalDays = Object.keys(teamAvailability).length;
    const lowDays = Object.values(teamAvailability).filter(day => day.status === 'low').length;
    
    return Math.round((lowDays / totalDays) * 100);
  };
  
  const lowAvailabilityPercentage = getLowAvailabilityPercentage();
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiUsers className="mr-2 text-primary-500" />
          Team Availability Analytics
        </h2>
        <button 
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
        >
          {showAdvancedAnalytics ? 'Show less' : 'Show more'} 
          {showAdvancedAnalytics ? 
            <FiArrowUp className="ml-1" /> : 
            <FiArrowDown className="ml-1" />
          }
        </button>
      </div>
      
      <div className="p-4">
        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="text-sm text-gray-500 mb-1">Overall Availability</div>
            <div className="flex items-center justify-between">
              <div 
                className={`text-2xl font-bold ${
                  overallAvailability.status === 'high' ? 'text-green-600' : 
                  overallAvailability.status === 'medium' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}
              >
                {overallAvailability.percentage}%
              </div>
              <div 
                className={`text-xs px-2 py-1 rounded-full ${
                  overallAvailability.status === 'high' ? 'bg-green-100 text-green-800' : 
                  overallAvailability.status === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}
              >
                {overallAvailability.status === 'high' ? 'Good' : 
                 overallAvailability.status === 'medium' ? 'Moderate' : 
                 'Low'}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Average team availability for {format(currentMonth, 'MMMM yyyy')}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="text-sm text-gray-500 mb-1">Team Size</div>
            <div className="text-2xl font-bold text-primary-600">{users.length}</div>
            <div className="mt-2 text-sm text-gray-600">
              Total team members in the system
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="text-sm text-gray-500 mb-1">Low Availability Days</div>
            <div className={`text-2xl font-bold ${lowAvailabilityPercentage > 30 ? 'text-red-600' : 'text-gray-700'}`}>
              {lowAvailabilityPercentage}%
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Percentage of days with low team availability
            </div>
          </motion.div>
        </div>
        
        {/* Advanced analytics */}
        {showAdvancedAnalytics && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <FiBarChart2 className="mr-2 text-primary-500" /> 
              Detailed Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Busiest days */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Lowest Availability Days</h4>
                
                <div className="space-y-3">
                  {busiestDays.length > 0 ? (
                    busiestDays.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {format(parseISO(day.date), 'EEE, MMM d')}
                        </div>
                        <div className="w-1/2">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${
                                day.availablePercentage >= 70 ? 'bg-green-500' : 
                                day.availablePercentage >= 50 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${day.availablePercentage}%` }}
                              variants={chartVariants}
                              initial="hidden"
                              animate="visible"
                              custom={index}
                            ></motion.div>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {day.availablePercentage}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No data available</div>
                  )}
                </div>
              </div>
              
              {/* Most frequent leaves */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Team Members on Leave</h4>
                
                <div className="space-y-3">
                  {frequentLeaves.length > 0 ? (
                    frequentLeaves.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {user.name}
                        </div>
                        <div className="w-1/2">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary-500"
                              style={{ width: `${Math.min(100, user.count * 20)}%` }}
                              variants={chartVariants}
                              initial="hidden"
                              animate="visible"
                              custom={index}
                            ></motion.div>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {user.count} {user.count === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No leave data available</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <h4 className="text-sm font-medium text-primary-700 mb-2 flex items-center">
                <FiPieChart className="mr-2" /> Recommendation
              </h4>
              <p className="text-sm text-gray-600">
                {overallAvailability.percentage < 60 ? 
                  `Your team's availability is relatively low for ${format(currentMonth, 'MMMM')}. Consider adjusting leave plans or cross-training team members to maintain sufficient coverage.` : 
                  `Team availability looks good for ${format(currentMonth, 'MMMM')}. You have appropriate coverage for most days.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamAvailabilityAnalytics; 