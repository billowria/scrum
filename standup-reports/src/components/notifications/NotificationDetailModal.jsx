import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiCalendar, FiClock, FiUser, FiCheck, FiXCircle, 
  FiAlertCircle, FiCheckSquare, FiMessageCircle, FiFileText
} from 'react-icons/fi';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../../supabaseClient';
import { notifyLeaveStatus, notifyTimesheetStatus } from '../../utils/notificationHelper';

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const contentVariants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { 
    scale: 0.95, 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

const NotificationDetailModal = ({ notification, isOpen, onClose, onAction }) => {
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  if (!notification || !isOpen) return null;

  const handleAction = async (action) => {
    setProcessing(true);
    setActionResult(null);

    try {
      const parts = notification.id.split('-');
      const type = parts[0];
      const id = parts[1];

      if (type === 'leave') {
        // Handle leave request approval/rejection
        const { error } = await supabase
          .from('leave_plans')
          .update({ status: action })
          .eq('id', id);

        if (error) throw error;

        // Send notification to user
        await notifyLeaveStatus(
          notification.data,
          action,
          notification.data.users?.id || notification.data.user_id
        );

        setActionResult({ type: 'success', message: `Leave request ${action}!` });
      } else if (type === 'timesheet') {
        // Handle timesheet approval/rejection
        const { error } = await supabase
          .from('timesheet_submissions')
          .update({ status: action })
          .eq('id', id);

        if (error) throw error;

        // Send notification to user
        await notifyTimesheetStatus(
          action,
          notification.data.start_date,
          notification.data.end_date,
          notification.data.user_id
        );

        setActionResult({ type: 'success', message: `Timesheet ${action}!` });
      }

      // Call parent callback
      if (onAction) {
        onAction(action, notification);
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error handling action:', error);
      setActionResult({ type: 'error', message: 'Failed to process action. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const renderContent = () => {
    const parts = notification.id.split('-');
    const type = parts[0];

    switch (type) {
      case 'leave':
        return renderLeaveContent();
      case 'timesheet':
        return renderTimesheetContent();
      case 'announcement':
        return renderAnnouncementContent();
      case 'task':
        return renderTaskContent();
      default:
        return renderDefaultContent();
    }
  };

  const renderLeaveContent = () => {
    const data = notification.data;
    const startDate = parseISO(data.start_date);
    const endDate = parseISO(data.end_date);
    const days = differenceInDays(endDate, startDate) + 1;

    return (
      <>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <FiCalendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
            <p className="text-gray-600 mt-1">Leave Request Details</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {data.users?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{data.users?.name || 'Employee'}</p>
              <p className="text-sm text-gray-600">{data.users?.teams?.name || 'No Team'}</p>
            </div>
          </div>
        </div>

        {/* Leave Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <FiCalendar className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Leave Duration</p>
              <p className="font-semibold text-gray-900">
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </p>
              <p className="text-sm text-blue-600 mt-1">{days} {days === 1 ? 'day' : 'days'}</p>
            </div>
          </div>

          {data.reason && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Reason</p>
              <p className="text-gray-900">{data.reason}</p>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <FiClock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Requested</p>
              <p className="font-semibold text-gray-900">
                {format(parseISO(notification.created_at), 'MMM dd, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {data.status === 'pending' && (
          <div className="flex gap-3">
            <motion.button
              onClick={() => handleAction('approved')}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  Approve
                </>
              )}
            </motion.button>

            <motion.button
              onClick={() => handleAction('rejected')}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiXCircle className="w-5 h-5" />
                  Reject
                </>
              )}
            </motion.button>
          </div>
        )}
      </>
    );
  };

  const renderTimesheetContent = () => {
    const data = notification.data;
    
    return (
      <>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
            <FiClock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
            <p className="text-gray-600 mt-1">Timesheet Submission</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold">
              {data.users?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{data.users?.name || 'Employee'}</p>
              <p className="text-sm text-gray-600">{data.users?.teams?.name || 'No Team'}</p>
            </div>
          </div>
        </div>

        {/* Timesheet Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <FiCalendar className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="font-semibold text-gray-900">
                {new Date(data.start_date).toLocaleDateString()} - {new Date(data.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <FiClock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="font-semibold text-gray-900">
                {format(parseISO(notification.created_at), 'MMM dd, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {data.status === 'pending' && (
          <div className="flex gap-3">
            <motion.button
              onClick={() => handleAction('approved')}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  Approve
                </>
              )}
            </motion.button>

            <motion.button
              onClick={() => handleAction('rejected')}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiXCircle className="w-5 h-5" />
                  Reject
                </>
              )}
            </motion.button>
          </div>
        )}
      </>
    );
  };

  const renderAnnouncementContent = () => {
    const data = notification.data;
    
    return (
      <>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <FiMessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
            <p className="text-gray-600 mt-1">
              {format(parseISO(notification.created_at), 'MMM dd, yyyy • h:mm a')}
            </p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 mb-6 border border-purple-100">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{data.content}</p>
        </div>

        {data.manager?.name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUser className="w-4 h-4" />
            <span>Posted by {data.manager.name}</span>
          </div>
        )}
      </>
    );
  };

  const renderTaskContent = () => {
    const data = notification.data;
    
    return (
      <>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <FiCheckSquare className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
            <p className="text-gray-600 mt-1">Task Notification</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
          <p className="text-gray-900 leading-relaxed">{notification.message}</p>
        </div>

        <div className="text-sm text-gray-600">
          <p>{format(parseISO(notification.created_at), 'MMM dd, yyyy • h:mm a')}</p>
        </div>
      </>
    );
  };

  const renderDefaultContent = () => {
    return (
      <>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
            <FiFileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
            <p className="text-gray-600 mt-1">Notification</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
          <p className="text-gray-900 leading-relaxed">{notification.message}</p>
        </div>

        <div className="text-sm text-gray-600">
          <p>{format(parseISO(notification.created_at), 'MMM dd, yyyy • h:mm a')}</p>
        </div>
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>

            {/* Content */}
            <div className="p-8">
              {renderContent()}

              {/* Action Result */}
              {actionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
                    actionResult.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {actionResult.type === 'success' ? (
                    <FiCheck className="w-5 h-5" />
                  ) : (
                    <FiAlertCircle className="w-5 h-5" />
                  )}
                  <p className="font-medium">{actionResult.message}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDetailModal;
