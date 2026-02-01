import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiClock, FiVideo, FiMapPin, FiUsers, FiLink, FiCalendar, FiBriefcase, FiZap, FiActivity, FiLayers, FiShield, FiTarget } from 'react-icons/fi';
import { format, parseISO, isPast } from 'date-fns';

const MEETING_ICONS = {
    general: FiVideo,
    standup: FiActivity,
    one_on_one: FiTarget,
    client: FiBriefcase,
    team: FiLayers,
    brainstorm: FiZap,
    review: FiShield,
};

const MEETING_COLORS = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
};

export default function DayAgendaModal({
    isOpen,
    onClose,
    date,
    meetings = [],
    onEditMeeting,
    onAddMeeting
}) {
    if (!isOpen || !date) return null;

    const sortedMeetings = [...meetings].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const isToday = new Date().toDateString() === date.toDateString();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
            >
                {/* Transparent Backdrop */}
                <div className="absolute inset-0 bg-transparent" onClick={onClose} />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                {format(date, 'EEEE')}
                            </h2>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                                {format(date, 'MMM do, yyyy')}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {sortedMeetings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center opacity-60">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                                    <FiCalendar className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">No scheduled collisions</p>
                                <p className="text-xs text-slate-400 mt-1">Free day for deep work!</p>
                            </div>
                        ) : (
                            <div className="relative pl-4 space-y-6">
                                {/* Timeline Line */}
                                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>

                                {sortedMeetings.map((meeting, index) => {
                                    const start = parseISO(meeting.start_time);
                                    const end = parseISO(meeting.end_time);
                                    const isPastEvent = isPast(end);
                                    const Icon = MEETING_ICONS[meeting.meeting_type] || FiVideo;
                                    const colorClass = MEETING_COLORS[meeting.color] || MEETING_COLORS.blue;

                                    return (
                                        <motion.div
                                            key={meeting.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => onEditMeeting(meeting)}
                                            className={`relative group cursor-pointer pl-6 transition-all hover:translate-x-1 ${isPastEvent ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`absolute left-[-5px] top-4 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${isPastEvent ? 'bg-slate-300' : 'bg-indigo-500 ring-4 ring-indigo-500/20'}`}></div>

                                            <div className={`p-4 rounded-2xl border ${colorClass} bg-opacity-50 dark:bg-opacity-20 hover:shadow-lg transition-all`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg bg-white/80 dark:bg-black/20 text-inherit`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                                            {meeting.meeting_type?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold font-mono opacity-80">
                                                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                                    </span>
                                                </div>

                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                                                    {meeting.title}
                                                </h3>

                                                {meeting.meeting_participants && meeting.meeting_participants.length > 0 && (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="flex -space-x-2">
                                                            {meeting.meeting_participants.slice(0, 4).map((p, i) => (
                                                                <img
                                                                    key={i}
                                                                    src={p.user?.avatar_url || `https://ui-avatars.com/api/?name=${p.user?.name}`}
                                                                    className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                                                                />
                                                            ))}
                                                            {meeting.meeting_participants.length > 4 && (
                                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-[8px] font-bold">
                                                                    +{meeting.meeting_participants.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {meeting.meeting_link && (
                                                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-xs font-medium opacity-80 overflow-hidden">
                                                        <FiLink className="shrink-0" />
                                                        <span className="truncate">{meeting.meeting_link}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 shrink-0">
                        <button
                            onClick={() => onAddMeeting(date)}
                            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Schedule New Collision</span>
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
