import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiCheckSquare, FiSmile, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

const meterVariants = {
  initial: { width: 0 },
  animate: (value) => ({
    width: `${value}%`,
    transition: { duration: 1, ease: [0.42, 0, 0.58, 1] }
  })
};

const cardVariants = {
  hover: {
    y: -5,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.3 }
  }
};

const TeamHealthIndicator = ({ metrics, teamId, refreshData }) => {
  const [infoMode, setInfoMode] = useState(false);
  
  // Get color for metric based on value
  const getMetricColor = (value) => {
    if (value >= 80) return 'from-green-500 to-emerald-400';
    if (value >= 60) return 'from-blue-500 to-indigo-400';
    if (value >= 40) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  };
  
  // Get emoji for metric based on value
  const getMetricEmoji = (value) => {
    if (value >= 80) return '🚀';
    if (value >= 60) return '👍';
    if (value >= 40) return '🤔';
    return '😓';
  };
  
  // Helper to render metric
  const renderMetric = (name, value, icon) => {
    const color = getMetricColor(value);
    return (
      <motion.div 
        className="mb-4"
        whileHover="hover"
        variants={cardVariants}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            {icon}
            <span className="text-sm font-medium text-gray-700 ml-2">{name}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-1">
              {value}%
            </span>
            <span>{getMetricEmoji(value)}</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-gradient-to-r ${color}`}
            initial="initial"
            animate="animate"
            custom={value}
            variants={meterVariants}
          />
        </div>
      </motion.div>
    );
  };
  
  // Render info panel about metrics
  const renderInfoPanel = () => (
    <motion.div 
      className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start mb-2">
        <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
        <p>Team health metrics are updated weekly based on various data points including sprint completion, code quality, and team feedback.</p>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3">
        <div className="flex items-center">
          <FiUsers className="text-blue-600 mr-1" />
          <span>Collaboration</span>
        </div>
        <div className="flex items-center">
          <FiActivity className="text-blue-600 mr-1" />
          <span>Velocity</span>
        </div>
        <div className="flex items-center">
          <FiCheckSquare className="text-blue-600 mr-1" />
          <span>Quality</span>
        </div>
        <div className="flex items-center">
          <FiSmile className="text-blue-600 mr-1" />
          <span>Happiness</span>
        </div>
      </div>
    </motion.div>
  );
  
  return (
    <div>
      {/* Info toggle */}
      <div className="flex justify-end mb-2">
        <button 
          className="text-xs text-gray-500 hover:text-primary-600 flex items-center"
          onClick={() => setInfoMode(!infoMode)}
        >
          {infoMode ? 'Hide Info' : 'What is this?'}
        </button>
      </div>
      
      {/* Info panel */}
      {infoMode && renderInfoPanel()}
      
      {/* Metrics */}
      <div>
        {renderMetric('Collaboration', metrics.collaboration, <FiUsers className="text-primary-500" />)}
        {renderMetric('Velocity', metrics.velocity, <FiActivity className="text-primary-500" />)}
        {renderMetric('Quality', metrics.quality, <FiCheckSquare className="text-primary-500" />)}
        {renderMetric('Happiness', metrics.happiness, <FiSmile className="text-primary-500" />)}
      </div>
      
      {/* Overall rating */}
      <div className="mt-4 text-center">
        <div className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-700">
          <div className="flex items-center">
            <FiTrendingUp className="mr-2" />
            <span className="font-medium">
              Team Health: {Math.round((metrics.collaboration + metrics.velocity + metrics.quality + metrics.happiness) / 4)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamHealthIndicator; 