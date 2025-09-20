import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { FiCalendar, FiTarget, FiClock, FiCheckCircle, FiFlag } from 'react-icons/fi';

const SprintBoard = ({ sprints, onEditSprint, onSelectSprint, selectedSprintId }) => {
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
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning':
        return 'from-blue-500 to-blue-600';
      case 'In Progress':
        return 'from-amber-500 to-amber-600';
      case 'Completed':
        return 'from-emerald-500 to-emerald-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Planning':
        return <FiCalendar className="w-4 h-4" />;
      case 'In Progress':
        return <FiClock className="w-4 h-4" />;
      case 'Completed':
        return <FiCheckCircle className="w-4 h-4" />;
      default:
        return <FiFlag className="w-4 h-4" />;
    }
  };

  // Check if sprint is active
  const isSprintActive = (sprint) => {
    const today = new Date();
    return isWithinInterval(today, {
      start: parseISO(sprint.start_date),
      end: parseISO(sprint.end_date)
    });
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sprints.map((sprint) => (
          <motion.div
            key={sprint.id}
            variants={itemVariants}
            className={`
              relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all 
              cursor-pointer border-2 ${selectedSprintId === sprint.id ? 'border-indigo-500' : 'border-transparent'}
            `}
            onClick={() => onSelectSprint(sprint.id)}
          >
            {/* Colorful gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(sprint.status)} opacity-90`}></div>
            
            {/* Content */}
            <div className="relative p-5 text-white">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold truncate">{sprint.name}</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                  {getStatusIcon(sprint.status)}
                  <span>{sprint.status}</span>
                </div>
              </div>
              
              <p className="text-sm opacity-90 mb-4 line-clamp-2">{sprint.goal || 'No goal set'}</p>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  <span>{format(parseISO(sprint.start_date), 'MMM d')} - {format(parseISO(sprint.end_date), 'MMM d, yyyy')}</span>
                </div>
                
                {isSprintActive(sprint) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs animate-pulse">
                    <span>Active</span>
                  </div>
                )}
              </div>
              
              {/* Edit button */}
              <button
                className="absolute top-2 right-2 p-1 bg-white bg-opacity-0 hover:bg-opacity-20 rounded-full transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSprint(sprint);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {sprints.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="w-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg"
        >
          <FiTarget className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Sprints Found</h3>
          <p className="text-sm">Create a new sprint to start planning your work.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SprintBoard;