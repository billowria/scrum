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
        bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden
        ${isToday ? 'ring-2 ring-indigo-500/20 bg-indigo-50/30' : ''}
        ${className}
      `}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
      }}
      variants={groupVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div
        className={`
          p-5 cursor-pointer transition-all duration-300
          ${isToday ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50' : 'bg-white/30 hover:bg-white/50'}
        `}
        onClick={onToggle}
        whileHover={{ scale: 1.002 }}
        whileTap={{ scale: 0.998 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Date indicator */}
            <div className={`
              flex flex-col items-center justify-center w-16 h-16 rounded-2xl
              font-bold text-lg shadow-sm border
              ${isToday
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-400'
                : 'bg-white text-slate-700 border-white/60'
              }
            `}>
              <div className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-indigo-100' : 'text-slate-400'}`}>
                {dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </div>
              <div className="text-2xl leading-none mt-0.5">{dateObj.getDate()}</div>
            </div>

            {/* Date info */}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">
                  {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                </h2>
                {relativeLabel && (
                  <motion.span
                    className={`
                      px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm border
                      ${isToday
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
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
              <p className="text-sm font-medium text-slate-500 mt-1">
                {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats and controls */}
          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm bg-white/40 px-4 py-2 rounded-xl border border-white/50">
              <div className="flex items-center gap-2 text-slate-500" title="Total Reports">
                <FiUsers className="w-4 h-4" />
                <span className="font-semibold">{totalCount}</span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              <div className="flex items-center gap-2 text-emerald-600" title="Completed">
                <FiCheckCircle className="w-4 h-4" />
                <span className="font-semibold">{completedCount}</span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              <div className={`text-xs font-bold ${completionRate === 100 ? 'text-indigo-600' : 'text-slate-500'}`}>
                {completionRate}%
              </div>
            </div>

            {/* Expand/Collapse icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`
                p-2 rounded-full transition-colors
                ${isToday ? 'text-indigo-600 bg-indigo-100/50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}
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
            className="border-t border-white/40 bg-white/20"
          >
            <div className="p-5">
              {variant === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onUserClick={onUserClick}
                      onViewDetails={onViewReport}
                      variant="default"
                      className="h-full"
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