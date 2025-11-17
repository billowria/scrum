import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiMoreHorizontal, FiEye, FiUser } from 'react-icons/fi';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import './design-tokens.css';

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export const ReportCard = ({
  report,
  onUserClick = null,
  onViewDetails = null,
  className = '',
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const { users } = report;
  const hasContent = report.yesterday || report.today;
  const status = hasContent ? 'submitted' : 'pending';

  const hasBlockers = !!report.blockers;
  const hasYesterday = !!report.yesterday;
  const hasToday = !!report.today;
  const hasNotes = !!report.notes;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No update';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        className={`p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all ${className}`}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={users?.name}
              avatarUrl={users?.avatar_url}
              size="sm"
              onClick={onUserClick}
            />
            <div>
              <p className="font-medium text-gray-900">{users?.name}</p>
              <p className="text-xs text-gray-500">{users?.teams?.name}</p>
            </div>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`
        relative bg-white rounded-xl border shadow-sm
        overflow-hidden transition-all duration-300
        ${hasBlockers ? 'border-amber-200 bg-gradient-to-br from-white to-amber-50/30' : 'border-gray-200'}
        hover:shadow-lg hover:border-gray-300
        ${className}
      `}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Status indicator bar */}
      <div
        className={`h-1 w-full ${
          status === 'submitted'
            ? 'bg-gradient-to-r from-success-500 to-emerald-500'
            : 'bg-gradient-to-r from-warning-500 to-amber-500'
        }`}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={users?.name}
              avatarUrl={users?.avatar_url}
              size="md"
              onClick={onUserClick}
            />
            <div>
              <h3 className="font-semibold text-gray-900">{users?.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span>{users?.teams?.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs">{formatDate(report.date)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge
              status={status}
              size="sm"
              showPulse={status === 'pending'}
            />

            <div className="relative">
              <motion.button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiMoreHorizontal className="w-4 h-4" />
              </motion.button>

              <AnimatePresence>
                {isActionsOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-xl z-10 overflow-hidden"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.button
                      onClick={() => {
                        onViewDetails?.(report);
                        setIsActionsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      whileHover={{ backgroundColor: 'var(--gray-50)' }}
                    >
                      <FiEye className="w-4 h-4" />
                      View Details
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        onUserClick?.(users);
                        setIsActionsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      whileHover={{ backgroundColor: 'var(--gray-50)' }}
                    >
                      <FiUser className="w-4 h-4" />
                      View Profile
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-3">
          {/* Yesterday */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">Y</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Yesterday</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {isExpanded ? (report.yesterday || 'No update') : truncateText(report.yesterday)}
              </p>
            </div>
          </div>

          {/* Today */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">T</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Today</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {isExpanded ? (report.today || 'No update') : truncateText(report.today)}
              </p>
            </div>
          </div>

          {/* Blockers */}
          <div className="flex gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              hasBlockers ? 'bg-amber-50' : 'bg-emerald-50'
            }`}>
              {hasBlockers ? (
                <FiAlertCircle className="w-4 h-4 text-amber-600" />
              ) : (
                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Blockers</h4>
              <p className={`text-sm leading-relaxed ${
                hasBlockers ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {isExpanded ? (report.blockers || 'No blockers reported') : truncateText(report.blockers)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {hasNotes && (
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {isExpanded ? report.notes : truncateText(report.notes)}
              </p>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {(report.yesterday?.length > 100 || report.today?.length > 100 || report.blockers?.length > 100 || hasNotes) && (
          <div className="mt-4 flex justify-center">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReportCard;