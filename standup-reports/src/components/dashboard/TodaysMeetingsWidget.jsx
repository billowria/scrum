import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiVideo, FiClock, FiUsers, FiExternalLink, FiCalendar, FiZap, FiCoffee, FiBriefcase, FiTarget, FiArrowRight } from 'react-icons/fi';
import { format, parseISO, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import LoadingSpinner from '../shared/LoadingSpinner';

// Meeting type configurations
const MEETING_TYPE_CONFIG = {
    general: { icon: FiVideo, gradient: 'from-blue-500 to-indigo-600', text: 'text-blue-600 dark:text-blue-400' },
    standup: { icon: FiCoffee, gradient: 'from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400' },
    one_on_one: { icon: FiUsers, gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-600 dark:text-emerald-400' },
    client: { icon: FiBriefcase, gradient: 'from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400' },
    team: { icon: FiUsers, gradient: 'from-cyan-500 to-blue-600', text: 'text-cyan-600 dark:text-cyan-400' },
    review: { icon: FiTarget, gradient: 'from-rose-500 to-pink-600', text: 'text-rose-600 dark:text-rose-400' },
    brainstorm: { icon: FiZap, gradient: 'from-yellow-400 to-amber-500', text: 'text-yellow-600 dark:text-yellow-400' },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

const TodaysMeetingsWidget = ({ meetings = [], loading, navigate, onMeetingClick }) => {
    const now = new Date();

    const { pastMeetings, upcomingMeetings, currentMeeting } = useMemo(() => {
        const sorted = [...meetings].sort((a, b) =>
            new Date(a.start_time) - new Date(b.start_time)
        );

        let current = null;
        const upcoming = [];
        const past = [];

        sorted.forEach(meeting => {
            const startTime = parseISO(meeting.start_time);
            const endTime = parseISO(meeting.end_time);

            if (isBefore(startTime, now) && isAfter(endTime, now)) {
                current = meeting;
            } else if (isAfter(startTime, now)) {
                upcoming.push(meeting);
            } else {
                past.push(meeting);
            }
        });

        return { pastMeetings: past, upcomingMeetings: upcoming, currentMeeting: current };
    }, [meetings, now]);

    const renderCompactMeetingRow = (meeting, isCurrent = false, isPast = false) => {
        const config = MEETING_TYPE_CONFIG[meeting.meeting_type] || MEETING_TYPE_CONFIG.general;
        const Icon = config.icon;
        const startTime = parseISO(meeting.start_time);
        const endTime = parseISO(meeting.end_time);
        const participants = meeting.meeting_participants || [];

        return (
            <motion.div
                key={meeting.id}
                onClick={() => onMeetingClick?.(meeting)}
                whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${isCurrent
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30'
                        : isPast
                            ? 'opacity-60 grayscale-[0.5] border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/30'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
            >
                {/* Time & Status Strip */}
                <div className={`flex flex-col items-center justify-center w-12 flex-shrink-0 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className={`text-[11px] font-bold leading-none ${isPast ? 'line-through opacity-70' : ''}`}>{format(startTime, 'HH:mm')}</span>
                    {isCurrent && (
                        <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 animate-pulse text-green-500">
                            Now
                        </span>
                    )}
                    {isPast && (
                        <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 text-gray-400">
                            Done
                        </span>
                    )}
                </div>

                {/* Vertical Separator */}
                <div className={`w-0.5 h-8 rounded-full bg-gradient-to-b ${config.gradient} opacity-40`} />

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {meeting.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
                        <span className="truncate opacity-80">{format(startTime, 'h:mm')} - {format(endTime, 'h:mm a')}</span>
                        {participants.length > 0 && (
                            <>
                                <span className="w-0.5 h-0.5 rounded-full bg-gray-400" />
                                <span className="flex items-center gap-0.5">
                                    <FiUsers size={10} /> {participants.length}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Action */}
                {meeting.meeting_link && !isPast && (
                    <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`p-1.5 rounded-md transition-colors ${isCurrent
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        title="Join Meeting"
                    >
                        <FiExternalLink size={12} />
                    </a>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            variants={itemVariants}
            className="flex flex-col h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700 overflow-hidden"
        >
            {/* Compact Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <FiVideo size={14} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white">Meetings</h3>
                        <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                            {format(now, 'EEEE, MMM d')}
                        </p>
                    </div>
                </div>
                {meetings.length > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {meetings.length}
                    </span>
                )}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center h-20">
                        <LoadingSpinner scale={0.5} />
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-4 opacity-60">
                        <div className="p-2 rounded-full bg-gray-50 dark:bg-slate-700/50 mb-2">
                            <FiCalendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">No Meetings</p>
                    </div>
                ) : (
                    <>
                        {pastMeetings.map(m => renderCompactMeetingRow(m, false, true))}
                        {currentMeeting && renderCompactMeetingRow(currentMeeting, true)}
                        {upcomingMeetings.map(m => renderCompactMeetingRow(m))}
                    </>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-2 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/50">
                <button
                    onClick={() => navigate('/leave-calendar?tab=meetings')}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                    View Calendar <FiArrowRight size={10} />
                </button>
            </div>
        </motion.div>
    );
};

export default TodaysMeetingsWidget;
