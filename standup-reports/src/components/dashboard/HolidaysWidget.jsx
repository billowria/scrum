import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiSun, FiUmbrella, FiGift } from 'react-icons/fi';
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

    const getHolidayIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('christmas') || lowerName.includes('new year')) return <FiGift className="w-4 h-4" />;
        if (lowerName.includes('summer')) return <FiSun className="w-4 h-4" />;
        return <FiCalendar className="w-4 h-4" />;
    };

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
            className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-pink-50/30 via-white to-rose-50/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-sm">
                            <FiCalendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">This Month's Holidays</h3>
                            <p className="text-[10px] text-gray-500">{format(today, 'MMMM yyyy')}</p>
                        </div>
                    </div>
                    {/* Optional: Add a 'View All' if there's a holidays page */}
                    {/* <button className="text-xs text-pink-600 font-bold hover:text-pink-700 flex items-center gap-1">
             View All <FiArrowRight className="w-3 h-3" />
          </button> */}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
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
                                        className={`group relative p-3 rounded-xl border transition-all ${isToday
                                                ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-pink-100 hover:shadow-sm'
                                            } ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Date Box */}
                                            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm flex-shrink-0`}>
                                                <span className="text-[10px] font-medium uppercase leading-none opacity-80">
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
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 animate-pulse">
                                                            TODAY
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 group-hover:text-pink-600 transition-colors">
                                                        {format(holidayDate, 'EEEE')}
                                                    </span>
                                                    {holiday.description && (
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                                            • {holiday.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <FiUmbrella className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">No holidays this month</p>
                            <p className="text-xs text-gray-400 mt-1">Business as usual!</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default HolidaysWidget;
