import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isWeekend, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { FiUser, FiInfo } from 'react-icons/fi';

// Import the DayLeaveDetails component
import DayLeaveDetails from './DayLeaveDetails';

const dayVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  hover: { 
    scale: 1.05,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

const LeaveCalendarView = ({ 
  daysInMonth, 
  leaveData, 
  users, 
  onDayClick,
  selectedDates
}) => {
  // State for day leave details modal
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [leavesOnDay, setLeavesOnDay] = useState([]);
  
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
  
  // Function to get color based on number of people on leave
  const getIntensityColor = (count, total) => {
    const percentage = count / total;
    if (percentage > 0.5) return 'bg-red-100 border-red-200';
    if (percentage > 0.3) return 'bg-orange-100 border-orange-200';
    if (percentage > 0.1) return 'bg-yellow-100 border-yellow-200';
    if (percentage > 0) return 'bg-green-100 border-green-200';
    return '';
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
  
  // Handle viewing day details
  const handleViewDayDetails = (day) => {
    const leaves = getUsersOnLeave(day);
    setSelectedDay(day);
    setLeavesOnDay(leaves);
    setShowDayDetails(true);
  };
  
  return (
    <div className="calendar-container">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map(day => (
          <div 
            key={day} 
            className="text-center font-semibold py-2 text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before the 1st of the month */}
        {Array.from({ length: daysInMonth[0].getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className="h-24"></div>
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map((day, index) => {
          const usersOnLeave = getUsersOnLeave(day);
          const isWeekendDay = isWeekend(day);
          const dayClass = isWeekendDay 
            ? 'bg-gray-100 text-gray-500' 
            : 'bg-white';
          const intensityClass = getIntensityColor(usersOnLeave.length, users.length);
          const isSelected = isDaySelected(day);
          
          return (
            <motion.div
              key={index}
              className={`
                h-24 border rounded-lg overflow-hidden shadow-sm relative
                ${dayClass} 
                ${isSelected ? 'bg-primary-100 border-primary-300 ring-2 ring-primary-500' : intensityClass}
              `}
              variants={dayVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={(e) => {
                // If shift key is pressed, show leave details instead of selecting the date
                if (e.shiftKey || e.ctrlKey) {
                  handleViewDayDetails(day);
                } else {
                  onDayClick(day);
                }
              }}
              transition={{ delay: index * 0.01 }}
            >
              <div className="p-1 text-right">
                <span className="text-sm font-medium">
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="p-1">
                {usersOnLeave.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {usersOnLeave.slice(0, 3).map((leave, i) => (
                      <div 
                        key={i} 
                        className="flex items-center text-xs bg-white/70 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-primary-50"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent day selection
                          handleViewDayDetails(day);
                        }}
                      >
                        <FiUser className="mr-1 flex-shrink-0 text-primary-600" />
                        <span className="truncate">
                          {leave.users?.name || 'Unknown'}
                        </span>
                      </div>
                    ))}
                    
                    {usersOnLeave.length > 3 && (
                      <div 
                        className="text-xs text-center font-medium text-gray-600 cursor-pointer hover:text-primary-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent day selection
                          handleViewDayDetails(day);
                        }}
                      >
                        +{usersOnLeave.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Day details button for mobile - easier to tap */}
      <div className="mt-6 text-center md:hidden">
        <div className="text-sm text-gray-600 mb-2">
          <FiInfo className="inline mr-1" /> Tap on a day to select it for leave request
        </div>
        <div className="text-sm text-gray-600">
          Hold Shift/Ctrl + Click to view who's on leave that day
        </div>
      </div>
      
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
