import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiClock, FiUser, FiCalendar, FiMessageSquare, FiEdit } from 'react-icons/fi';

const DailyStandupDemo = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  
  // Scroll animation values
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8], [0, 1, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -50]);
  
  // Sample data for demonstration
  const standupEntries = [
    {
      id: 1,
      user: {
        name: "Alex Chen",
        avatar: "AC",
        color: "#6366F1" // Indigo
      },
      timestamp: "Today, 09:15 AM",
      yesterday: "Completed user authentication flow and fixed sidebar navigation bugs",
      today: "Working on API integration for the dashboard analytics",
      blockers: "None at the moment",
      status: "complete"
    },
    {
      id: 2,
      user: {
        name: "Taylor Swift",
        avatar: "TS",
        color: "#EC4899" // Pink
      },
      timestamp: "Today, 08:45 AM",
      yesterday: "Designed new UI components for the mobile app",
      today: "Collaborating with backend team on data structure",
      blockers: "Waiting for design approval from product team",
      status: "complete"
    },
    {
      id: 3,
      user: {
        name: "Jordan Lee",
        avatar: "JL",
        color: "#8B5CF6" // Violet
      },
      timestamp: "Today, 09:30 AM",
      yesterday: "Code review and QA testing for release",
      today: "Setting up automated testing for new features",
      blockers: "Jenkins pipeline needs configuration update",
      status: "pending"
    }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
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

  return (
    <motion.div 
      ref={containerRef}
      className="max-w-4xl mx-auto overflow-hidden relative"
      style={{ opacity, y }}
    >
      {/* Interface header */}
      <motion.div 
        className="bg-white rounded-t-xl shadow-md p-4 border border-gray-200 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            AP
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Daily Standup Reports</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 flex items-center">
            <FiCalendar className="mr-1" />
            Today
          </span>
          <motion.button 
            className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium flex items-center"
            whileHover={{ scale: 1.05, backgroundColor: "#EEF2FF" }}
            whileTap={{ scale: 0.98 }}
          >
            <FiEdit className="mr-1" />
            New Report
          </motion.button>
        </div>
      </motion.div>
      
      {/* Standup entries */}
      <motion.div 
        className="bg-white rounded-b-xl shadow-md border-x border-b border-gray-200 divide-y divide-gray-100"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {standupEntries.map((entry, index) => (
          <motion.div 
            key={entry.id} 
            className="p-4 hover:bg-gray-50 transition-colors"
            variants={itemVariants}
            whileHover={{ 
              x: 5,
              backgroundColor: "rgba(238, 242, 255, 0.5)",
              transition: { duration: 0.2 }
            }}
          >
            <div className="flex items-start">
              {/* User avatar */}
              <motion.div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium mr-3 flex-shrink-0"
                style={{ backgroundColor: entry.user.color }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {entry.user.avatar}
              </motion.div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="font-medium text-gray-900 mr-2">{entry.user.name}</h4>
                  <span className="text-xs text-gray-500 flex items-center">
                    <FiClock className="mr-1" size={12} />
                    {entry.timestamp}
                  </span>
                  <div className="ml-auto">
                    {entry.status === "complete" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <FiCheckCircle className="mr-1" size={12} />
                        Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        <FiClock className="mr-1" size={12} />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Yesterday</div>
                    <p className="text-gray-600">{entry.yesterday}</p>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Today</div>
                    <p className="text-gray-600">{entry.today}</p>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Blockers</div>
                    <p className={entry.blockers === "None at the moment" ? "text-green-600" : "text-amber-600"}>
                      {entry.blockers}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Quick actions */}
        <motion.div 
          className="p-3 bg-gray-50 flex justify-end space-x-2"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button 
            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 flex items-center"
            whileHover={{ scale: 1.05, backgroundColor: "#F9FAFB" }}
            whileTap={{ scale: 0.98 }}
          >
            <FiMessageSquare className="mr-1" size={14} />
            Comment
          </motion.button>
          <motion.button 
            className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm flex items-center"
            whileHover={{ scale: 1.05, backgroundColor: "#4F46E5" }}
            whileTap={{ scale: 0.98 }}
          >
            <FiCheckCircle className="mr-1" size={14} />
            Mark Reviewed
          </motion.button>
        </motion.div>
      </motion.div>
      
      {/* Floating decoration elements */}
      <motion.div 
        className="absolute -right-12 top-10 h-20 w-20 rounded-full bg-indigo-100 opacity-40 z-0"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.4, 0.2, 0.4]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <motion.div 
        className="absolute -left-8 bottom-20 h-16 w-16 rounded-full bg-pink-100 opacity-40 z-0"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
          opacity: [0.4, 0.3, 0.4]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2
        }}
      />
    </motion.div>
  );
};

export default DailyStandupDemo; 