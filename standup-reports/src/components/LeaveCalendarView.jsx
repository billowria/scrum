import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  isWeekend, 
  isSameDay, 
  isWithinInterval, 
  parseISO,
  isToday
} from 'date-fns';
import { 
  FiUser, 
  FiInfo, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiX, 
  FiCalendar,
  FiUsers
} from 'react-icons/fi';

// Import components
import DayLeaveDetails from './DayLeaveDetails';

// Animation variants
const calendarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.03
    }
  }
};

const dayVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 10
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 25 
    }
  },
  hover: { 
    scale: 1.05,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

const leaveItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'spring', 
      stiffness: 500, 
      damping: 30 
    }
  }
};

const rippleVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0
  },
  visible: { 
    opacity: 0.6, 
    scale: 5,
    transition: { 
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    scale: 8,
    transition: { 
      duration: 0.4
    }
  }
};

const LeaveCalendarView = ({ 
  daysInMonth, 
  leaveData, 
  users, 
  onDayClick,
  selectedDates,
  teamAvailability
}) => {
  // State for day leave details modal
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [leavesOnDay, setLeavesOnDay] = useState([]);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  
  // Get weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Function to check if a day has leave data
  const getUsersOnLeave = (day) => {
    return leaveData.filter(leave => 
      isWithinInterval(day, { 
        start: parseISO(leave.start_date), 
        end: parseISO(leave.end_date) 
      })
    );
  };
  
  // Get availability status color classes
  const getAvailabilityColors = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const availability = teamAvailability[dateStr];
    
    if (!availability) return {
      bg: '',
      text: '',
      border: '',
      indicator: ''
    };
    
    if (availability.availablePercentage >= 80) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-100',
        indicator: 'bg-green-400'
      };
    } else if (availability.availablePercentage >= 50) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-100',
        indicator: 'bg-yellow-400'
      };
    } else {
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-100',
        indicator: 'bg-red-400'
      };
    }
  };
  
  // Check if a day is selected (for leave request form)
  const isDaySelected = (day) => {
    if (!selectedDates.start && !selectedDates.end) return false;
    
    if (selectedDates.start && selectedDates.end) {
      return isWithinInterval(day, {
        start: selectedDates.start,
        end: selectedDates.end
      });
    }
    
    return selectedDates.start && isSameDay(day, selectedDates.start);
  };
  
  // New function to get selection state for styling
  const getSelectionState = (day) => {
    if (!selectedDates.start) return '';
    
    if (selectedDates.start && selectedDates.end) {
      if (isSameDay(day, selectedDates.start)) {
        return 'start';
      }
      if (isSameDay(day, selectedDates.end)) {
        return 'end';
      }
      if (isWithinInterval(day, {
        start: selectedDates.start,
        end: selectedDates.end
      })) {
        return 'between';
      }
    } else if (isSameDay(day, selectedDates.start)) {
      return 'single';
    }
    
    return '';
  };
  
  // Handle viewing day details
  const handleViewDayDetails = (day) => {
    const leaves = getUsersOnLeave(day);
    setSelectedDay(day);
    setLeavesOnDay(leaves);
    setShowDayDetails(true);
  };
  
  // Handle day click with ripple animation
  const handleDayClick = (day, e) => {
    if (e.shiftKey || e.ctrlKey) {
      handleViewDayDetails(day);
      return;
    }
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipplePosition({ x, y });
    setShowRipple(true);
    
    // Hide ripple after animation
    setTimeout(() => {
      setShowRipple(false);
    }, 600);
    
    // Pass the day to the parent component
    onDayClick(day);
  };
  
  return (
    <div className="calendar-container relative overflow-hidden rounded-lg">
      {/* Weekday headers */}
      <motion.div 
        className="grid grid-cols-7 gap-2 mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {weekdays.map((day, i) => (
          <motion.div 
            key={day} 
            className={`text-center font-medium py-2 text-sm rounded-md ${i === 0 || i === 6 ? 'text-rose-600 bg-rose-50' : 'text-gray-600 bg-gray-50'}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            {day}
          </motion.div>
        ))}
      </motion.div>
      
      {/* Calendar grid */}
      <motion.div 
        className="grid grid-cols-7 gap-2"
        variants={calendarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Empty cells for days before the 1st of the month */}
        {Array.from({ length: daysInMonth[0].getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className="h-28 lg:h-32 border-transparent"></div>
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map((day, index) => {
          const usersOnLeave = getUsersOnLeave(day);
          const isWeekendDay = isWeekend(day);
          const isTodayDate = isToday(day);
          const availabilityColors = getAvailabilityColors(day);
          const selectionState = getSelectionState(day);
          
          // Enhanced selection classes
          let selectionClass = '';
          if (selectionState === 'start') {
            selectionClass = 'bg-gradient-to-r from-primary-600 to-primary-500 text-white';
          } else if (selectionState === 'end') {
            selectionClass = 'bg-gradient-to-l from-primary-600 to-primary-500 text-white';
          } else if (selectionState === 'between') {
            selectionClass = 'bg-primary-100 text-primary-800';
          } else if (selectionState === 'single') {
            selectionClass = 'bg-primary-600 text-white';
          }
          
          return (
            <motion.div
              key={index}
              className={`
                h-28 lg:h-32 border overflow-hidden rounded-lg relative shadow-sm 
                ${isWeekendDay ? 'bg-gray-50' : availabilityColors.bg || 'bg-white'}
                ${isTodayDate ? 'ring-2 ring-primary-400' : ''}
                ${selectionClass}
                ${availabilityColors.border || 'border-gray-200'}
                transition-all duration-300
              `}
              variants={dayVariants}
              whileHover={!isWeekendDay ? "hover" : undefined}
              whileTap={!isWeekendDay ? "tap" : undefined}
              onClick={(e) => handleDayClick(day, e)}
              custom={index}
            >
              {/* Day number */}
              <div className={`
                p-2 flex justify-between items-start
                ${selectionState ? 'text-current' : isWeekendDay ? 'text-gray-500' : 'text-gray-800'}
              `}>
                <div className="flex items-center">
                  {/* Availability indicator dot */}
                  {!isWeekendDay && teamAvailability[format(day, 'yyyy-MM-dd')] && (
                    <div className={`w-2 h-2 rounded-full mr-1.5 ${availabilityColors.indicator}`}></div>
                  )}
                  
                  <span className={`
                    text-sm font-medium
                    ${selectionState ? '' : (isTodayDate ? 'text-primary-700' : '')}
                  `}>
                  {format(day, 'd')}
                </span>
                </div>
                
                {isTodayDate && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${selectionState ? 'bg-white/80 text-primary-800' : 'bg-primary-100 text-primary-800'}`}>
                    Today
                  </span>
                )}
              </div>
              
              {/* Availability percentage indicator */}
              {!isWeekendDay && teamAvailability[format(day, 'yyyy-MM-dd')] && (
                <div className={`
                  absolute top-2 right-2 text-xs font-medium px-1.5 py-0.5 rounded-full
                  ${selectionState ? 'bg-white/80' : 'bg-white'} 
                  ${availabilityColors.text}
                `}>
                  {teamAvailability[format(day, 'yyyy-MM-dd')].availablePercentage}%
                </div>
              )}
              
              {/* Leave items */}
              <div className="px-2 mt-1 overflow-hidden">
                <AnimatePresence>
                    {usersOnLeave.slice(0, 3).map((leave, i) => (
                    <motion.div 
                      key={`${leave.id}-${i}`} 
                      className={`
                        mb-1 px-2 py-1 rounded text-xs truncate flex items-center
                        ${leave.status === 'approved' 
                          ? (selectionState ? 'bg-green-100/90' : 'bg-green-100') + ' text-green-800' 
                          : leave.status === 'pending' 
                            ? (selectionState ? 'bg-yellow-100/90' : 'bg-yellow-100') + ' text-yellow-800'
                            : (selectionState ? 'bg-red-100/90' : 'bg-red-100') + ' text-red-800'
                        }
                        cursor-pointer hover:brightness-95 transition-all
                      `}
                      variants={leaveItemVariants}
                        onClick={(e) => {
                        e.stopPropagation();
                          handleViewDayDetails(day);
                        }}
                      >
                      {leave.status === 'approved' ? (
                        <FiCheckCircle className="mr-1 flex-shrink-0" />
                      ) : leave.status === 'pending' ? (
                        <FiClock className="mr-1 flex-shrink-0" />
                      ) : (
                        <FiX className="mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate">{leave.users?.name?.split(' ')[0] || 'Unknown'}</span>
                    </motion.div>
                    ))}
                </AnimatePresence>
                    
                    {usersOnLeave.length > 3 && (
                  <motion.div
                    className={`
                      text-xs text-center mt-1 font-medium px-2 py-1 rounded
                      ${selectionState 
                        ? 'bg-white/80 text-gray-700' 
                        : 'bg-gray-100 text-gray-700'
                      }
                      cursor-pointer hover:bg-gray-200 transition-all
                    `}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                      e.stopPropagation();
                          handleViewDayDetails(day);
                        }}
                      >
                    <FiUsers className="mr-1 inline-block" />
                        +{usersOnLeave.length - 3} more
                  </motion.div>
                    )}
                
                {usersOnLeave.length === 0 && !isWeekendDay && (
                  <div className={`text-xs italic ${selectionState ? 'text-white/70' : 'text-gray-400'} mt-1`}>
                    No leaves
                  </div>
                )}
              </div>
              
              {/* Selection indicators */}
              {selectionState === 'start' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-700"></div>
              )}
              {selectionState === 'end' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-700"></div>
              )}
              {selectionState === 'single' && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-700"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-700"></div>
                </>
              )}
              
              {/* Ripple effect */}
              <AnimatePresence>
                {showRipple && isSameDay(day, selectedDates.start) && (
                  <motion.div
                    className="absolute bg-primary-300 rounded-full pointer-events-none"
                    style={{
                      width: '10px',
                      height: '10px',
                      left: ripplePosition.x,
                      top: ripplePosition.y,
                      translateX: '-50%',
                      translateY: '-50%'
                    }}
                    variants={rippleVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Legend */}
      <motion.div 
        className="flex flex-wrap items-center justify-between mt-6 gap-2 text-xs bg-gray-50 rounded-lg p-3 border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-400 mr-1.5"></div>
            <span className="text-gray-700">High Availability</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1.5"></div>
            <span className="text-gray-700">Medium Availability</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-400 mr-1.5"></div>
            <span className="text-gray-700">Low Availability</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <FiCheckCircle className="text-green-500 mr-1.5" />
            <span className="text-gray-700">Approved Leave</span>
          </div>
          <div className="flex items-center">
            <FiClock className="text-yellow-500 mr-1.5" />
            <span className="text-gray-700">Pending Leave</span>
          </div>
          <div className="flex items-center">
            <FiInfo className="text-primary-500 mr-1.5" />
            <span className="text-gray-700">Shift+Click to see details</span>
          </div>
        </div>
      </motion.div>
      
      {/* Day leave details modal */}
      <DayLeaveDetails 
        isOpen={showDayDetails}
        onClose={() => setShowDayDetails(false)}
        selectedDay={selectedDay}
        leavesOnDay={leavesOnDay}
      />
    </div>
  );
};

export default LeaveCalendarView;
