import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { FiArrowUp, FiBarChart2, FiCalendar, FiCheckSquare, FiClock, FiTrendingUp,
  FiUsers, FiActivity, FiAward, FiAlertTriangle, FiBell } from 'react-icons/fi';

const TeamProgressDashboard = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });
  
  // Scroll animation values
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8], [0, 1, 1, 0.7]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -50]);
  const rotate = useTransform(scrollYProgress, [0, 0.5], [5, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);

  // Achievement percentages for the progress bars
  const completionRate = 85;
  const teamEngagement = 92;
  const blockerResolution = 76;
  
  // Team member data
  const teamMembers = [
    { id: 1, name: "Alex Chen", avatar: "AC", color: "#6366F1", status: "active", completedTasks: 23, pendingTasks: 5 },
    { id: 2, name: "Taylor Swift", avatar: "TS", color: "#EC4899", status: "active", completedTasks: 19, pendingTasks: 3 },
    { id: 3, name: "Jordan Lee", avatar: "JL", color: "#8B5CF6", status: "away", completedTasks: 15, pendingTasks: 8 },
    { id: 4, name: "Morgan Riley", avatar: "MR", color: "#10B981", status: "active", completedTasks: 28, pendingTasks: 2 }
  ];
  
  // Weekly activity data for the chart
  const weeklyActivity = [65, 45, 75, 60, 80, 72, 50];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
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

  return (
    <motion.div 
      ref={containerRef}
      className="max-w-5xl mx-auto overflow-hidden relative"
      style={{ opacity, y, scale, rotateX: rotate }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main dashboard panel */}
        <motion.div 
          className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          {/* Dashboard header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FiBarChart2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">Team Progress Dashboard</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm flex items-center bg-white/20 px-3 py-1 rounded-full">
                  <FiCalendar className="mr-1" />
                  Current Sprint
                </span>
              </div>
            </div>
          </div>
          
          {/* Dashboard metrics */}
          <div className="p-5">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <motion.div 
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200"
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-indigo-700 mb-1">Completion Rate</div>
                    <div className="text-2xl font-bold text-indigo-900">{completionRate}%</div>
                  </div>
                  <div className="bg-indigo-200 rounded-full p-2 text-indigo-700">
                    <FiCheckSquare className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 h-2 bg-indigo-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                  />
                </div>
                <div className="text-xs text-indigo-700 mt-1 flex items-center">
                  <FiArrowUp className="mr-1" />
                  +12% from last sprint
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200"
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(236, 72, 153, 0.4)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-pink-700 mb-1">Team Engagement</div>
                    <div className="text-2xl font-bold text-pink-900">{teamEngagement}%</div>
                  </div>
                  <div className="bg-pink-200 rounded-full p-2 text-pink-700">
                    <FiUsers className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 h-2 bg-pink-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-pink-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${teamEngagement}%` }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                  />
                </div>
                <div className="text-xs text-pink-700 mt-1 flex items-center">
                  <FiArrowUp className="mr-1" />
                  +8% from last sprint
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-purple-700 mb-1">Blocker Resolution</div>
                    <div className="text-2xl font-bold text-purple-900">{blockerResolution}%</div>
                  </div>
                  <div className="bg-purple-200 rounded-full p-2 text-purple-700">
                    <FiActivity className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purple-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${blockerResolution}%` }}
                    transition={{ duration: 1.5, delay: 0.4 }}
                  />
                </div>
                <div className="text-xs text-purple-700 mt-1 flex items-center">
                  <FiArrowUp className="mr-1" />
                  +15% from last sprint
                </div>
              </motion.div>
            </motion.div>
            
            {/* Activity Chart */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Weekly Activity</h4>
                <div className="text-xs text-indigo-600 font-medium flex items-center">
                  <FiTrendingUp className="mr-1" />
                  +18% overall
                </div>
              </div>
              <div className="h-48 flex items-end justify-between">
                {weeklyActivity.map((value, index) => (
                  <div key={index} className="flex flex-col items-center w-full">
                    <motion.div 
                      className="w-full bg-indigo-600 rounded-t-sm opacity-80 mx-1"
                      style={{ 
                        backgroundImage: 'linear-gradient(to top, #6366F1, #8B5CF6)',
                      }}
                      initial={{ height: 0 }}
                      animate={isInView ? { height: `${value * 0.4}%` } : { height: 0 }}
                      transition={{ duration: 1, delay: 0.1 * index, ease: "easeOut" }}
                      whileHover={{ opacity: 1 }}
                    >
                      <motion.div 
                        className="bg-white px-2 py-1 rounded text-xs text-indigo-800 font-medium -translate-y-7 opacity-0 transition-all shadow"
                        whileHover={{ opacity: 1, translateY: -10 }}
                      >
                        {value}%
                      </motion.div>
                    </motion.div>
                    <div className="text-xs text-gray-500 mt-2">{days[index]}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Quick insights */}
            <motion.div 
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center text-gray-600 text-sm">
                <FiAward className="text-indigo-500 mr-2" />
                <span>Team's most productive day was <span className="font-medium">Wednesday</span> with 75% engagement</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Team members panel */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <FiUsers className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">Team Members</h3>
            </div>
          </div>
          
          <motion.div 
            className="divide-y divide-gray-100"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member.id} 
                className="p-3 hover:bg-gray-50"
                variants={itemVariants}
                whileHover={{ 
                  x: 5,
                  backgroundColor: "rgba(238, 242, 255, 0.5)",
                }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-center">
                  {/* Avatar */}
                  <motion.div 
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white font-medium mr-3"
                    style={{ backgroundColor: member.color }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {member.avatar}
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900 text-sm">{member.name}</h4>
                      <div className="ml-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          member.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                        }`}></span>
                      </div>
                    </div>
                    
                    <div className="mt-1 flex text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <FiCheckSquare className="mr-1 text-green-500" />
                        {member.completedTasks} tasks
                      </span>
                      <span className="flex items-center">
                        <FiClock className="mr-1 text-amber-500" />
                        {member.pendingTasks} pending
                      </span>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div>
                    <motion.div 
                      className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                      whileHover={{ scale: 1.1, backgroundColor: "#EEF2FF", color: "#6366F1" }}
                    >
                      <FiBell className="h-4 w-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* View all button */}
            <motion.div 
              className="p-3"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button 
                className="w-full py-2 text-center text-sm text-indigo-600 font-medium rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                View All Team Members
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Floating decoration elements */}
      <motion.div 
        className="absolute -right-20 bottom-40 h-40 w-40 rounded-full bg-indigo-100 opacity-30 z-0"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
      />
      
      <motion.div 
        className="absolute -left-10 top-40 h-32 w-32 rounded-full bg-pink-100 opacity-30 z-0"
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, -90, 0],
          opacity: [0.3, 0.15, 0.3]
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", delay: 1 }}
      />
    </motion.div>
  );
};

export default TeamProgressDashboard; 