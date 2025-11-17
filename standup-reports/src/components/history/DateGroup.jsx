import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCalendar, FiUsers, FiCheckCircle } from 'react-icons/fi';
import ReportCard from './ReportCard';
import './design-tokens.css';

const groupVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const contentVariants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const DateGroup = ({
  date,
  reports,
  isExpanded,
  onToggle,
  onUserClick,
  onViewReport,
  className = '',
  variant = 'default'
}) => {
  const dateObj = new Date(date);
  const isToday = new Date().toDateString() === dateObj.toDateString();
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === dateObj.toDateString();

  const completedCount = reports.filter(r => r.yesterday || r.today).length;
  const totalCount = reports.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDateHeader = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getRelativeLabel = () => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return null;
  };

  const relativeLabel = getRelativeLabel();

  return (
    <motion.div
      className={`
        bg-white rounded-xl border shadow-md overflow-hidden
        ${isToday ? 'border-primary-200 bg-gradient-to-br from-white to-primary-50/20' : 'border-gray-200'}
        ${className}
      `}
      style={{
        boxShadow: 'var(--light-shadow-md)'
      }}
      variants={groupVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div
        className={`
          p-4 cursor-pointer transition-colors duration-200
          ${isToday ? 'bg-gradient-to-r from-primary-50 to-blue-50' : 'bg-white hover:bg-gray-50'}
        `}
        onClick={onToggle}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Date indicator */}
            <div className={`
              flex flex-col items-center justify-center w-14 h-14 rounded-xl
              font-bold text-lg shadow-sm
              ${isToday
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
              }
            `}>
              <div className="text-xs font-medium uppercase tracking-wider">
                {dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </div>
              <div>{dateObj.getDate()}</div>
            </div>

            {/* Date info */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                </h2>
                {relativeLabel && (
                  <motion.span
                    className={`
                      px-2 py-1 text-xs font-semibold rounded-full
                      ${isToday
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-700'
                      }
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                  >
                    {relativeLabel}
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats and controls */}
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <FiUsers className="w-4 h-4" />
                <span className="font-medium">{totalCount}</span>
              </div>

              <div className="flex items-center gap-1.5 text-green-600">
                <FiCheckCircle className="w-4 h-4" />
                <span className="font-medium">{completedCount}</span>
              </div>

              <div className="text-xs font-medium text-gray-500">
                {completionRate}% complete
              </div>
            </div>

            {/* Expand/Collapse icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`
                p-2 rounded-full transition-colors
                ${isToday ? 'text-primary-600 hover:bg-primary-100' : 'text-gray-400 hover:bg-gray-100'}
              `}
            >
              <FiChevronDown className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="border-t border-gray-200/30"
          >
            <div className="p-4">
              {variant === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onUserClick={onUserClick}
                      onViewDetails={onViewReport}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onUserClick={onUserClick}
                      onViewDetails={onViewReport}
                      variant="default"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DateGroup;