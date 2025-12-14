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
        className={`p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60 hover:border-indigo-200 transition-all ${className}`}
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
              <p className="font-semibold text-slate-800">{users?.name}</p>
              <p className="text-xs text-slate-500">{users?.teams?.name}</p>
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
        relative bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm
        overflow-hidden transition-all duration-300
        ${hasBlockers ? 'shadow-amber-500/10 ring-1 ring-amber-500/20' : 'hover:shadow-indigo-500/10 hover:border-indigo-200/50'}
        ${className}
      `}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      layout
    >
      {/* Status indicator bar - Enhanced */}
      <div
        className={`h-1.5 w-full ${status === 'submitted'
          ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400'
          : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400'
          }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-30 transition blur-sm" />
              <div className="relative">
                <UserAvatar
                  name={users?.name}
                  avatarUrl={users?.avatar_url}
                  size="md"
                  onClick={onUserClick}
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{users?.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                <span>{users?.teams?.name}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs">{formatDate(report.date)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge
              status={status}
              size="sm"
              showPulse={status === 'pending'}
            />

            <div className="relative">
              <motion.button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiMoreHorizontal className="w-5 h-5" />
              </motion.button>

              <AnimatePresence>
                {isActionsOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 shadow-xl z-20 overflow-hidden"
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
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left border-b border-gray-100/50"
                    >
                      <FiEye className="w-4 h-4" />
                      View Details
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        onUserClick?.(users);
                        setIsActionsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
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
        <div className="space-y-4">
          {/* Yesterday */}
          <div className="group rounded-xl p-3 bg-slate-50/50 hover:bg-white/50 border border-transparent hover:border-slate-100 transition-all">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/10">
                Y
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Yesterday</div>
                <div className="prose prose-sm prose-slate max-w-none max-h-32 overflow-y-auto custom-scrollbar">
                  <RichTextDisplay content={report.yesterday} />
                </div>
              </div>
            </div>
          </div>

          {/* Today */}
          <div className="group rounded-xl p-3 bg-slate-50/50 hover:bg-white/50 border border-transparent hover:border-slate-100 transition-all">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100/50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-500/10">
                T
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today</div>
                <div className="prose prose-sm prose-slate max-w-none max-h-32 overflow-y-auto custom-scrollbar">
                  <RichTextDisplay content={report.today} />
                </div>
              </div>
            </div>
          </div>

          {/* Blockers */}
          {report.blockers && (
            <div className="group rounded-xl p-3 bg-rose-50/30 hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-100/50 text-rose-600 flex items-center justify-center font-bold text-xs ring-1 ring-rose-500/10">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-rose-600/80 uppercase tracking-wider mb-1">Blockers</div>
                  <div className="prose prose-sm prose-rose max-w-none max-h-32 overflow-y-auto custom-scrollbar">
                    <RichTextDisplay content={report.blockers} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div >
  );
};

export default ReportCard;