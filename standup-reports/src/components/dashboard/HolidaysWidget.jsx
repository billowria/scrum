import React from 'react';
import LoadingSpinner from '../shared/LoadingSpinner';
import { motion } from 'framer-motion';
import { FiCalendar, FiUmbrella, FiArrowRight } from 'react-icons/fi';
import { format, parseISO, isSameDay } from 'date-fns';

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

const HolidaysWidget = ({ holidays = [], loading, navigate }) => {
    // Sort holidays by date
    const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
    const today = new Date();

    const getGradient = (index) => {
        const gradients = [
            'from-pink-500 to-rose-500',
            'from-purple-500 to-indigo-500',
            'from-blue-500 to-cyan-500',
            'from-amber-500 to-orange-500'
        ];
        return gradients[index % gradients.length];
    };

    const renderCompactHolidayRow = (holiday, idx) => {
        const holidayDate = parseISO(holiday.date);
        const isToday = isSameDay(holidayDate, today);
        const isPast = holidayDate < today && !isToday;
        const gradient = getGradient(idx);

        if (isPast) return null; // Optionally hide past holidays in compact view

        return (
            <motion.div
                key={holiday.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${isToday
                        ? 'bg-pink-50/50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-800/30'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
            >
                {/* Date Stack */}
                <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm flex-shrink-0`}>
                    <span className="text-[9px] font-bold uppercase leading-none opacity-90">{format(holidayDate, 'MMM')}</span>
                    <span className="text-xs font-extra-bold leading-none mt-0.5">{format(holidayDate, 'd')}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${isToday ? 'text-pink-700 dark:text-pink-300' : 'text-gray-900 dark:text-white'}`}>
                            {holiday.name}
                        </h4>
                        {isToday && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 animate-pulse">
                                TODAY
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        {format(holidayDate, 'EEEE')}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div
            variants={itemVariants}
            className="flex flex-col h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                        <FiCalendar size={14} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white">Holidays</h3>
                        <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                            {format(today, 'MMMM yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center h-20">
                        <LoadingSpinner scale={0.5} />
                    </div>
                ) : sortedHolidays.filter(h => new Date(h.date) >= today).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-4 opacity-60">
                        <div className="p-2 rounded-full bg-gray-50 dark:bg-slate-700/50 mb-2">
                            <FiUmbrella className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">No Upcoming Holidays</p>
                    </div>
                ) : (
                    sortedHolidays
                        .filter(h => new Date(h.date) >= new Date().setHours(0, 0, 0, 0))
                        .slice(0, 3) // Show top 3
                        .map((holiday, idx) => renderCompactHolidayRow(holiday, idx))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/50">
                <button
                    onClick={() => navigate('/leave-calendar?tab=holidays')}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                >
                    View All <FiArrowRight size={10} />
                </button>
            </div>
        </motion.div>
    );
};

export default HolidaysWidget;
