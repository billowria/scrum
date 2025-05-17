import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { FiCalendar, FiClock, FiUser, FiCheckCircle, FiX, 
  FiArrowLeft, FiArrowRight, FiPlus, FiFilter } from 'react-icons/fi';

const LeaveCalendarDemo = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  
  // Scroll animation values
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8], [0, 1, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
  
  // Current month data for the calendar
  const month = "May";
  const year = 2025;
  const daysInMonth = 31;
  const startDay = 3; // 0 = Sunday, 3 = Wednesday
  
  // Leave data
  const leaves = [
    { id: 1, name: "Alex Chen", type: "vacation", start: 8, end: 12, status: "approved", color: "bg-emerald-500" },
    { id: 2, name: "Taylor Swift", type: "sick", start: 15, end: 15, status: "approved", color: "bg-amber-500" },
    { id: 3, name: "Jordan Lee", type: "personal", start: 22, end: 24, status: "pending", color: "bg-indigo-500" },
    { id: 4, name: "Morgan Riley", type: "vacation", start: 10, end: 14, status: "approved", color: "bg-pink-500" }
  ];
  
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
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };
  
  // Render days of the week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate calendar days
  const calendarDays = Array.from({ length: daysInMonth + startDay }, (_, i) => {
    if (i < startDay) return null;
    return i - startDay + 1;
  });
  
  // Check if a day has leave
  const getLeaveForDay = (day) => {
    return leaves.filter(leave => day >= leave.start && day <= leave.end);
  };
  
  return (
    <motion.div 
      ref={containerRef}
      className="max-w-5xl mx-auto overflow-hidden relative"
      style={{ opacity, y, scale }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5 }}
      >
        {/* Calendar header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <FiCalendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Team Leave Calendar</h3>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button 
                className="text-white bg-white/20 p-2 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiArrowLeft className="h-4 w-4" />
              </motion.button>
              <span className="text-lg font-medium">{month} {year}</span>
              <motion.button 
                className="text-white bg-white/20 p-2 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <motion.button 
              className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium flex items-center"
              whileHover={{ scale: 1.03, backgroundColor: "#EEF2FF" }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <FiPlus className="mr-1" />
              Request Leave
            </motion.button>
            
            <motion.button 
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center"
              whileHover={{ scale: 1.03, backgroundColor: "#F3F4F6" }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <FiFilter className="mr-1" />
              Filter
            </motion.button>
          </div>
          
          {/* Calendar grid */}
          <motion.div 
            className="grid grid-cols-7 gap-1 mb-4"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {/* Day headers */}
            {daysOfWeek.map((day, i) => (
              <motion.div 
                key={day} 
                className={`text-center py-2 text-sm font-medium ${
                  i === 0 || i === 6 ? 'text-red-400' : 'text-gray-500'
                }`}
                variants={itemVariants}
              >
                {day}
              </motion.div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, i) => {
              const dayLeaves = day ? getLeaveForDay(day) : [];
              const isWeekend = (i % 7 === 0) || ((i + 1) % 7 === 0);
              const isToday = day === 15; // Just for demo
              
              return (
                <motion.div 
                  key={i} 
                  className={`min-h-24 p-1 border rounded-lg overflow-hidden ${
                    day ? (isWeekend ? 'bg-gray-50' : 'bg-white') : 'bg-transparent border-transparent'
                  } ${isToday ? 'ring-2 ring-indigo-300' : ''}`}
                  variants={itemVariants}
                  whileHover={day ? { y: -3, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" } : {}}
                >
                  {day && (
                    <>
                      <div className={`text-right p-1 ${
                        isToday ? 'bg-indigo-100 text-indigo-800 font-medium rounded-t-md' : ''
                      }`}>
                        <span className={`text-sm ${isWeekend ? 'text-red-400' : 'text-gray-700'}`}>
                          {day}
                        </span>
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        {dayLeaves.map((leave) => (
                          <motion.div 
                            key={leave.id}
                            className={`text-xs px-1 py-0.5 rounded ${leave.color} text-white truncate`}
                            whileHover={{ scale: 1.05 }}
                            title={`${leave.name} - ${leave.type}`}
                          >
                            {leave.name.split(' ')[0]}
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          
          {/* Legend */}
          <motion.div 
            className="border-t border-gray-200 pt-4 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500 mr-1"></div>
                <span className="text-xs text-gray-600">Vacation</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-amber-500 mr-1"></div>
                <span className="text-xs text-gray-600">Sick Leave</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-indigo-500 mr-1"></div>
                <span className="text-xs text-gray-600">Personal</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-pink-500 mr-1"></div>
                <span className="text-xs text-gray-600">Remote Work</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Pending requests */}
        <motion.div 
          className="mt-2 p-4 bg-gray-50 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h4 className="text-sm font-medium text-gray-700 mb-3">Pending Approval</h4>
          
          <motion.div 
            className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
            whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                JL
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-medium text-gray-900 text-sm">Jordan Lee</h5>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    <FiClock className="mr-1" size={10} />
                    Pending
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mb-2">
                  <div className="flex">
                    <div className="w-16 flex-shrink-0 font-medium">Type:</div>
                    <div>Personal Leave</div>
                  </div>
                  <div className="flex">
                    <div className="w-16 flex-shrink-0 font-medium">Dates:</div>
                    <div>May 22 - May 24, 2025 (3 days)</div>
                  </div>
                  <div className="flex">
                    <div className="w-16 flex-shrink-0 font-medium">Note:</div>
                    <div className="italic">Family event</div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <motion.button 
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-600 flex items-center"
                    whileHover={{ scale: 1.05, backgroundColor: "#F9FAFB" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiX className="mr-1" size={12} />
                    Decline
                  </motion.button>
                  <motion.button 
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs flex items-center"
                    whileHover={{ scale: 1.05, backgroundColor: "#4F46E5" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiCheckCircle className="mr-1" size={12} />
                    Approve
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Floating decoration elements */}
      <motion.div 
        className="absolute -left-20 top-20 h-36 w-36 rounded-full bg-blue-100 opacity-30 z-0"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 60, 0],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
      />
      
      <motion.div 
        className="absolute -right-10 bottom-20 h-24 w-24 rounded-full bg-indigo-100 opacity-30 z-0"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -30, 0],
          opacity: [0.3, 0.15, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", delay: 1 }}
      />
    </motion.div>
  );
};

export default LeaveCalendarDemo; 