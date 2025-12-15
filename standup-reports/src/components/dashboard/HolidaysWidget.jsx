import React from 'react';
import LoadingSpinner from '../shared/LoadingSpinner';
import { motion } from 'framer-motion';
import { FiCalendar, FiUmbrella } from 'react-icons/fi';
import { format, parseISO, isSameDay } from 'date-fns';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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

    return (
        <motion.div
            variants={itemVariants}
            className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:border-pink-200"
        >
            {/* Header */}
            <div className="p-5 border-b border-pink-100/50 bg-gradient-to-r from-pink-50/30 via-white to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shadow-sm border border-pink-100">
                        <FiCalendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">Holidays</h3>
                        <p className="text-[11px] font-medium text-gray-500">
                            {format(today, 'MMMM yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner scale={0.6} />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {sortedHolidays.length > 0 ? (
                        <div className="space-y-2">
                            {sortedHolidays.map((holiday, idx) => {
                                const holidayDate = parseISO(holiday.date);
                                const isToday = isSameDay(holidayDate, today);
                                const isPast = holidayDate < today && !isToday;
                                const gradient = getGradient(idx);

                                return (
                                    <motion.div
                                        key={holiday.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`group relative p-3 rounded-xl border transition-all duration-300 ${isToday
                                            ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 shadow-md'
                                            : 'bg-white/40 border-gray-100/50 hover:bg-white hover:border-pink-100 hover:shadow-sm'
                                            } ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Date Box */}
                                            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm flex-shrink-0`}>
                                                <span className="text-[9px] font-bold uppercase leading-none opacity-80">
                                                    {format(holidayDate, 'MMM')}
                                                </span>
                                                <span className="text-sm font-bold leading-none mt-0.5">
                                                    {format(holidayDate, 'd')}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-sm font-bold truncate ${isToday ? 'text-pink-900' : 'text-gray-900'}`}>
                                                        {holiday.name}
                                                    </h4>
                                                    {isToday && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 animate-pulse">
                                                            TODAY
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {format(holidayDate, 'EEEE')}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                                <FiUmbrella className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-600">No holidays this month</p>
                            <p className="text-xs text-gray-400 mt-1">Business as usual!</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default HolidaysWidget;
