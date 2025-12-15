import React from 'react';
import LoadingSpinner from '../shared/LoadingSpinner';
import { motion } from 'framer-motion';
import { FiCalendar, FiSun, FiUmbrella, FiGift } from 'react-icons/fi';
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
            className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-pink-100/50 h-full flex flex-col overflow-hidden hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 ring-1 ring-white/60"
        >
            <div className="p-6 pb-2 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <FiCalendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Holidays</h3>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
                    {sortedHolidays.length > 0 ? (
                        <div className="space-y-3">
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
                                        className={`group relative p-3 rounded-2xl border transition-all duration-300 ${isToday
                                            ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 shadow-md transform scale-[1.02]'
                                            : 'bg-white/40 border-gray-100/50 hover:bg-white hover:border-pink-100 hover:shadow-lg hover:shadow-pink-500/5'
                                            } ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Date Box */}
                                            <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                                <span className="text-[10px] font-bold uppercase leading-none opacity-80 tracking-wider">
                                                    {format(holidayDate, 'MMM')}
                                                </span>
                                                <span className="text-lg font-bold leading-none mt-0.5">
                                                    {format(holidayDate, 'd')}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-base font-bold truncate ${isToday ? 'text-pink-900' : 'text-gray-900'}`}>
                                                        {holiday.name}
                                                    </h4>
                                                    {isToday && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 animate-pulse shadow-sm">
                                                            TODAY
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500 group-hover:text-pink-600 transition-colors font-medium">
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
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                <FiUmbrella className="w-8 h-8 text-gray-300" />
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
