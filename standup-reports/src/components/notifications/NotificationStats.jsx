import React from 'react';
import { FiClock, FiCheckCircle } from 'react-icons/fi';

const NotificationStats = ({ stats }) => {
    const { total = 0, unread = 0, responseTime = '0m' } = stats;

    return (
        <div className="flex items-center gap-4">
            {/* Unread Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">
                    {unread} Unread
                </span>
            </div>

            {/* Response Time (Optional) */}
            {responseTime && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
                    <FiClock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Avg. Response: {responseTime}
                    </span>
                </div>
            )}
        </div>
    );
};

export default NotificationStats;
