import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { FiAward, FiStar, FiTrendingUp, FiPlusCircle, FiThumbsUp, 
  FiCheckCircle, FiUsers, FiClock, FiGift, FiBell, FiCalendar, FiArrowUp } from 'react-icons/fi';

const AchievementTrackingDemo = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const [activeTab, setActiveTab] = useState('team');
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  
  // Scroll animation values
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8], [0, 1, 1, 0.7]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -50]);
  const rotate = useTransform(scrollYProgress, [0, 0.2], [2, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);
  
  // Sample data
  const teamAchievements = [
    {
      id: 1,
      title: "Sprint Goal Exceeded",
      description: "Team completed 120% of planned story points for Sprint 34",
      date: "May 12, 2025",
      type: "performance",
      icon: <FiTrendingUp />,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      reactions: 8,
      isNew: true
    },
    {
      id: 2,
      title: "Zero Bug Milestone",
      description: "Reduced backlog to zero P1 and P2 bugs for the first time this quarter",
      date: "May 8, 2025",
      type: "quality",
      icon: <FiCheckCircle />,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      reactions: 12,
      isNew: false
    },
    {
      id: 3,
      title: "Successful Product Launch",
      description: "Successfully launched v2.0 of the product with zero critical issues",
      date: "Apr 29, 2025",
      type: "milestone",
      icon: <FiGift />,
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
      reactions: 15,
      isNew: false
    }
  ];
  
  const personalAchievements = [
    {
      id: 4,
      title: "Code Quality Champion",
      description: "Maintained 95%+ test coverage for 3 consecutive sprints",
      date: "May 14, 2025",
      type: "recognition",
      icon: <FiStar />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      reactions: 7,
      isNew: true
    },
    {
      id: 5,
      title: "Knowledge Sharing Star",
      description: "Conducted 3 internal workshops on the new architecture",
      date: "May 5, 2025",
      type: "learning",
      icon: <FiUsers />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      reactions: 9,
      isNew: false
    }
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
  
  const tabVariants = {
    inactive: { opacity: 0.7, y: 0 },
    active: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const currentAchievements = activeTab === 'team' ? teamAchievements : personalAchievements;
  
  return (
    <motion.div 
      ref={containerRef}
      className="max-w-5xl mx-auto overflow-hidden relative"
      style={{ opacity, y, scale, rotateX: rotate }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <FiAward className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Achievement Tracking</h3>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button 
                className="text-white bg-white/20 p-2 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiBell className="h-4 w-4" />
              </motion.button>
              <motion.button 
                className="text-white bg-white/20 p-2 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCalendar className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="p-2 flex">
            <motion.button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
                activeTab === 'team' ? 'text-purple-700 bg-purple-50' : 'text-gray-600 bg-white'
              }`}
              onClick={() => setActiveTab('team')}
              variants={tabVariants}
              animate={activeTab === 'team' ? 'active' : 'inactive'}
              whileHover={{ backgroundColor: activeTab === 'team' ? '#F5F3FF' : '#F9FAFB' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center">
                <FiUsers className="mr-2" />
                Team Achievements
              </div>
            </motion.button>
            <motion.button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
                activeTab === 'personal' ? 'text-pink-700 bg-pink-50' : 'text-gray-600 bg-white'
              }`}
              onClick={() => setActiveTab('personal')}
              variants={tabVariants}
              animate={activeTab === 'personal' ? 'active' : 'inactive'}
              whileHover={{ backgroundColor: activeTab === 'personal' ? '#FDF2F8' : '#F9FAFB' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center">
                <FiStar className="mr-2" />
                Personal Achievements
              </div>
            </motion.button>
          </div>
        </div>
        
        {/* Stats summary */}
        <motion.div 
          className="grid grid-cols-3 gap-4 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="bg-purple-50 rounded-lg p-3 border border-purple-100"
            whileHover={{ y: -3, boxShadow: "0 4px 6px -1px rgba(139, 92, 246, 0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-purple-700 mb-1">Total Achievements</div>
                <div className="text-xl font-bold text-purple-900">{activeTab === 'team' ? 16 : 8}</div>
              </div>
              <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                <FiAward />
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-pink-50 rounded-lg p-3 border border-pink-100"
            whileHover={{ y: -3, boxShadow: "0 4px 6px -1px rgba(236, 72, 153, 0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-pink-700 mb-1">This Month</div>
                <div className="text-xl font-bold text-pink-900">{activeTab === 'team' ? 5 : 2}</div>
              </div>
              <div className="bg-pink-100 p-2 rounded-full text-pink-600">
                <FiClock />
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-indigo-50 rounded-lg p-3 border border-indigo-100"
            whileHover={{ y: -3, boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-indigo-700 mb-1">Recognitions</div>
                <div className="text-xl font-bold text-indigo-900">{activeTab === 'team' ? 48 : 21}</div>
              </div>
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                <FiThumbsUp />
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Achievements list */}
        <motion.div 
          className="p-4 overflow-y-auto max-h-[400px]"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {currentAchievements.map((achievement) => (
            <motion.div 
              key={achievement.id}
              className="mb-4 relative"
              variants={itemVariants}
              layoutId={`achievement-${achievement.id}`}
              onClick={() => setExpandedAchievement(achievement)}
            >
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer"
                whileHover={{ 
                  y: -3, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex">
                  {/* Left colored bar */}
                  <div className={`w-2 ${achievement.color}`}></div>
                  
                  {/* Main content */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start">
                      {/* Icon */}
                      <div className={`h-10 w-10 rounded-full ${achievement.color} text-white flex items-center justify-center mr-3`}>
                        {achievement.icon}
                      </div>
                      
                      {/* Achievement details */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                          {achievement.isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <FiCalendar className="mr-1" size={12} />
                            {achievement.date}
                          </span>
                          
                          <span className="flex items-center">
                            <FiThumbsUp className="mr-1" size={12} />
                            {achievement.reactions} reactions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* "New" indicator with animation */}
              {achievement.isNew && (
                <motion.div 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 border-2 border-white"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
          
          {/* Add new achievement button */}
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button 
              className="bg-white border border-dashed border-gray-300 rounded-xl p-3 w-full flex items-center justify-center text-sm text-gray-500"
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: "#F9FAFB",
                borderColor: "#D1D5DB",
                color: "#4B5563"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlusCircle className="mr-2" />
              Create New Achievement
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Achievement detail modal */}
      <AnimatePresence mode="wait">
        {expandedAchievement && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedAchievement(null)}
          >
            <motion.div
              layoutId={`achievement-${expandedAchievement.id}`}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`h-2 w-full ${expandedAchievement.color}`}></div>
              <div className="p-6">
                <div className="flex mb-4">
                  <div className={`h-12 w-12 rounded-full ${expandedAchievement.color} text-white flex items-center justify-center mr-4`}>
                    {expandedAchievement.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{expandedAchievement.title}</h3>
                    <p className="text-sm text-gray-500">{expandedAchievement.date}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">{expandedAchievement.description}</p>
                
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiThumbsUp className="mr-1" />
                    <span>{expandedAchievement.reactions} reactions</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <motion.button
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center"
                      whileHover={{ scale: 1.05, backgroundColor: "#F3F4F6" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setExpandedAchievement(null)}
                    >
                      Close
                    </motion.button>
                    <motion.button
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm flex items-center"
                      whileHover={{ scale: 1.05, backgroundColor: "#EEF2FF" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiThumbsUp className="mr-1" />
                      Give Recognition
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating decoration elements */}
      <motion.div 
        className="absolute -right-20 top-20 h-40 w-40 rounded-full bg-purple-100 opacity-30 z-0"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 45, 0],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />
      
      <motion.div 
        className="absolute -left-16 bottom-10 h-28 w-28 rounded-full bg-pink-100 opacity-30 z-0"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -30, 0],
          opacity: [0.3, 0.15, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", delay: 2 }}
      />
    </motion.div>
  );
};

export default AchievementTrackingDemo; 