import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiVideo, FiCalendar, FiClock, FiUsers, FiRepeat, FiCheck,
    FiSearch, FiZap, FiTarget, FiBriefcase, FiLayers, FiActivity,
    FiGlobe, FiShield, FiAlertTriangle, FiTrash2, FiLink,
    FiList, FiPlus, FiMinus, FiCheckCircle, FiMoreVertical, FiChevronDown
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import {
    format, parseISO, addDays, isSameDay, startOfDay,
    differenceInMinutes, addMinutes, isAfter, isBefore
} from 'date-fns';

// --- CONFIGURATION ---
const MEETING_TYPES = [
    { id: 'general', label: 'General Meeting', icon: FiVideo, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'standup', label: 'Team Standup', icon: FiActivity, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
    { id: 'one_on_one', label: '1:1 Session', icon: FiTarget, color: 'purple', gradient: 'from-purple-500 to-indigo-600' },
    { id: 'client', label: 'Client Meeting', icon: FiBriefcase, color: 'indigo', gradient: 'from-indigo-500 to-violet-600' },
    { id: 'brainstorm', label: 'Brainstorming', icon: FiZap, color: 'amber', gradient: 'from-amber-400 to-orange-500' },
    { id: 'review', label: 'Project Review', icon: FiShield, color: 'rose', gradient: 'from-rose-500 to-pink-600' },
];

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4).toString().padStart(2, '0');
    const m = ((i % 4) * 15).toString().padStart(2, '0');
    return `${h}:${m}`;
});

// --- SUB-COMPONENTS ---
const TimePicker = ({ label, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex-1" ref={dropdownRef}>
            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 ml-1">{label}</span>
            <button
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white dark:bg-slate-800 p-3 rounded-2xl border flex items-center justify-between transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500/50 cursor-pointer'}
          ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-700 shadow-sm'}
        `}
            >
                <span className="text-sm font-bold text-indigo-500">{value}</span>
                <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-[240px] overflow-y-auto custom-scrollbar p-2"
                    >
                        {TIME_SLOTS.map(t => (
                            <button
                                key={t}
                                onClick={() => {
                                    onChange(t);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                  ${value === t
                                        ? 'bg-indigo-500 text-white shadow-lg'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
                `}
                            >
                                {t}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function MeetingModal({
    isOpen,
    onClose,
    initialData = null,
    selectedDate = null,
    currentUser,
    onSave,
    onDelete
}) {
    const { currentCompany } = useCompany();

    // App State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [conflicts, setConflicts] = useState([]);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [agenda, setAgenda] = useState(['']);
    const [meetingType, setMeetingType] = useState('general');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('10:30');
    const [recurring, setRecurring] = useState('none');
    const [untilDate, setUntilDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    const [link, setLink] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // Permissions check
    const isCreator = useMemo(() => {
        if (!initialData) return true; // Creating new
        return initialData.created_by === currentUser?.id;
    }, [initialData, currentUser?.id]);

    const canEdit = isCreator;

    // Initialization
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const start = parseISO(initialData.start_time);
                const end = parseISO(initialData.end_time);
                setTitle(initialData.title || '');
                setAgenda(initialData.description ? initialData.description.split('\n- ').filter(i => i.trim()).map(i => i.replace(/^- /, '')) : ['']);
                setMeetingType(initialData.meeting_type || 'general');
                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                setEndTime(format(end, 'HH:mm'));
                setRecurring(initialData.recurring || 'none');
                setUntilDate(initialData.until_date || format(addDays(start, 30), 'yyyy-MM-dd'));
                setLink(initialData.meeting_link || '');
                if (initialData.meeting_participants) {
                    setSelectedParticipants(initialData.meeting_participants.map(p => p.user_id));
                }
            } else {
                const baseDate = selectedDate || new Date();
                setDate(format(baseDate, 'yyyy-MM-dd'));
                setUntilDate(format(addDays(baseDate, 30), 'yyyy-MM-dd'));
                setTitle('');
                setAgenda(['']);
                setMeetingType('general');
                setStartTime('10:00');
                setEndTime('10:30');
                setRecurring('none');
                setLink('');
                setSelectedParticipants(currentUser ? [currentUser.id] : []);
            }
            setError(null);
            setConflicts([]);
        }
    }, [isOpen, initialData, selectedDate, currentUser]);

    // Fetch Team
    useEffect(() => {
        const fetchTeam = async () => {
            if (!currentCompany?.id) return;
            const { data } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .eq('company_id', currentCompany.id)
                .order('name');
            if (data) setTeamMembers(data);
        };
        if (isOpen) fetchTeam();
    }, [isOpen, currentCompany?.id]);

    // Conflict Detection Engine
    useEffect(() => {
        const checkConflicts = async () => {
            if (!isOpen || !currentCompany?.id || !date || !startTime || !endTime || !canEdit) return;

            setIsCheckingConflicts(true);
            try {
                const startTimestamp = `${date}T${startTime}:00`;
                const endTimestamp = `${date}T${endTime}:00`;

                if (startTimestamp >= endTimestamp) {
                    setIsCheckingConflicts(false);
                    return;
                }

                const { data } = await supabase
                    .from('meetings')
                    .select('id, title, start_time, end_time')
                    .eq('company_id', currentCompany.id)
                    .neq('id', initialData?.id || '00000000-0000-0000-0000-000000000000')
                    .or(`and(start_time.lte.${endTimestamp},end_time.gte.${startTimestamp})`);

                setConflicts(data || []);
            } catch (err) {
                console.error("Conflict check failed", err);
            } finally {
                setIsCheckingConflicts(false);
            }
        };

        const timeoutId = setTimeout(checkConflicts, 500);
        return () => clearTimeout(timeoutId);
    }, [date, startTime, endTime, isOpen, currentCompany?.id, initialData, canEdit]);

    // Handlers
    const handleAgendaChange = (index, value) => {
        const newAgenda = [...agenda];
        newAgenda[index] = value;
        setAgenda(newAgenda);
    };

    const addAgendaItem = () => setAgenda([...agenda, '']);
    const removeAgendaItem = (index) => {
        if (agenda.length === 1) return;
        setAgenda(agenda.filter((_, i) => i !== index));
    };

    const toggleParticipant = (uid) => {
        if (!canEdit) return;
        setSelectedParticipants(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const toggleSelectAllParticipants = () => {
        if (!canEdit) return;
        if (selectedParticipants.length === teamMembers.length) {
            // If all selected, just keep the current user if creating
            setSelectedParticipants(currentUser ? [currentUser.id] : []);
        } else {
            setSelectedParticipants(teamMembers.map(m => m.id));
        }
    };

    const handleSave = async () => {
        if (!canEdit) return;
        if (!title.trim()) { setError("Meeting title is required"); return; }
        if (startTime >= endTime) { setError("End time must follow start time"); return; }

        setLoading(true);
        setError(null);

        try {
            const description = agenda.filter(i => i.trim()).map(i => `- ${i}`).join('\n');
            const baseMeeting = {
                title,
                description,
                meeting_link: link,
                meeting_type: meetingType,
                recurring,
                until_date: untilDate,
                color: MEETING_TYPES.find(t => t.id === meetingType)?.color || 'blue',
                company_id: currentCompany.id,
                created_by: currentUser.id,
                updated_at: new Date().toISOString()
            };

            let meetingsToInsert = [];

            if (recurring === 'none' || initialData?.id) {
                meetingsToInsert.push({
                    ...baseMeeting,
                    start_time: `${date}T${startTime}:00`,
                    end_time: `${date}T${endTime}:00`,
                });
            } else {
                let ptrDate = parseISO(date);
                const stopDate = startOfDay(parseISO(untilDate));
                let count = 0;
                const MAX_INSTANCES = 52;

                while (startOfDay(ptrDate) <= stopDate && count < MAX_INSTANCES) {
                    const shouldCreate =
                        (recurring === 'daily') ||
                        (recurring === 'weekly' && ptrDate.getDay() === parseISO(date).getDay());

                    if (shouldCreate) {
                        const dString = format(ptrDate, 'yyyy-MM-dd');
                        meetingsToInsert.push({
                            ...baseMeeting,
                            start_time: `${dString}T${startTime}:00`,
                            end_time: `${dString}T${endTime}:00`,
                        });
                        count++;
                    }
                    ptrDate = addDays(ptrDate, 1);
                }
            }

            let targetIds = [];
            if (initialData?.id) {
                const { error: err } = await supabase.from('meetings').update(meetingsToInsert[0]).eq('id', initialData.id);
                if (err) throw err;
                targetIds = [initialData.id];
            } else {
                const { data, error: err } = await supabase.from('meetings').insert(meetingsToInsert).select('id');
                if (err) throw err;
                targetIds = data.map(m => m.id);
            }

            if (initialData?.id) {
                await supabase.from('meeting_participants').delete().eq('meeting_id', initialData.id);
            }

            if (selectedParticipants.length > 0 && targetIds.length > 0) {
                const participantRows = [];
                targetIds.forEach(mId => {
                    selectedParticipants.forEach(uId => {
                        participantRows.push({ meeting_id: mId, user_id: uId });
                    });
                });
                const { error: pErr } = await supabase.from('meeting_participants').insert(participantRows);
                if (pErr) console.warn("Participant sync warning:", pErr);
            }

            onSave?.();
            onClose();
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to save meeting");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-[1240px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-slate-800"
                    onClick={e => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="h-20 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <FiVideo className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {!canEdit ? 'Meeting Details' : initialData ? 'Edit Meeting' : 'Schedule New Meeting'}
                                </h2>
                                {!canEdit && (
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                        <FiShield className="w-3 h-3" /> View Only Access
                                    </span>
                                )}
                                {canEdit && (
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {loading ? 'Saving details...' : 'System Ready'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* 3-PANE CONTENT */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* LEFT PANE: LOGISTICS (25%) */}
                        <aside className="w-[320px] shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 overflow-y-auto p-6 space-y-8">

                            <section>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Meeting Type</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {MEETING_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            disabled={!canEdit}
                                            onClick={() => setMeetingType(type.id)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all border
                        ${meetingType === type.id
                                                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/10'
                                                    : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'}
                        ${!canEdit ? 'cursor-default' : 'cursor-pointer'}
                      `}
                                        >
                                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-white shadow-sm`}>
                                                <type.icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-[13px] font-bold ${meetingType === type.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Schedule</label>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <FiCalendar className="text-indigo-500 w-4 h-4" />
                                        <input
                                            type="date"
                                            disabled={!canEdit}
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 p-0 focus:ring-0 flex-1 disabled:opacity-70"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <TimePicker
                                            label="Start Time"
                                            value={startTime}
                                            onChange={setStartTime}
                                            disabled={!canEdit}
                                        />
                                        <TimePicker
                                            label="End Time"
                                            value={endTime}
                                            onChange={setEndTime}
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Recurrence</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                                    {['none', 'daily', 'weekly'].map(mode => (
                                        <button
                                            key={mode}
                                            disabled={!canEdit}
                                            onClick={() => setRecurring(mode)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                        ${recurring === mode
                                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }
                        ${!canEdit ? 'opacity-50' : ''}`}
                                        >
                                            {mode === 'none' ? 'Once' : mode}
                                        </button>
                                    ))}
                                </div>
                                {recurring !== 'none' && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30">
                                        <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Repeat Until</span>
                                        <input
                                            type="date"
                                            disabled={!canEdit}
                                            value={untilDate}
                                            onChange={e => setUntilDate(e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:ring-0 disabled:opacity-70"
                                        />
                                    </motion.div>
                                )}
                            </section>
                        </aside>

                        {/* CENTER PANE: CONTENT (50%) */}
                        <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                            <div className="max-w-[640px] mx-auto space-y-12">

                                {/* CONFLICTS */}
                                <AnimatePresence>
                                    {canEdit && conflicts.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400"
                                        >
                                            <FiAlertTriangle className="w-5 h-5 shrink-0" />
                                            <div className="text-xs">
                                                <p className="font-bold">Scheduling Conflict</p>
                                                <p className="opacity-80">There are {conflicts.length} other meetings scheduled during this time.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block">Meeting Title</label>
                                    <input
                                        disabled={!canEdit}
                                        placeholder="E.g. Daily Sprint Sync"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 dark:text-white placeholder-slate-200 dark:placeholder-slate-700 focus:ring-0 disabled:opacity-70"
                                    />
                                    <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-indigo-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: title ? '100%' : '0%' }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Agenda</h3>
                                        {canEdit && (
                                            <button
                                                onClick={addAgendaItem}
                                                className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            >
                                                <FiPlus className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {agenda.map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="group flex gap-4 items-start"
                                            >
                                                <div className="mt-2 text-[10px] font-black text-slate-300 group-focus-within:text-indigo-500">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </div>
                                                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-transparent focus-within:border-indigo-500/30 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                                                    <textarea
                                                        disabled={!canEdit}
                                                        rows={1}
                                                        value={item}
                                                        onChange={e => handleAgendaChange(idx, e.target.value)}
                                                        onInput={(e) => {
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                        }}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:ring-0 resize-none overflow-hidden disabled:opacity-70"
                                                        placeholder="Add discussion point..."
                                                    />
                                                </div>
                                                {canEdit && agenda.length > 1 && (
                                                    <button
                                                        onClick={() => removeAgendaItem(idx)}
                                                        className="mt-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-3">
                                        <FiAlertTriangle className="w-5 h-5 shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        </main>

                        {/* RIGHT PANE: COLLABORATION (25%) */}
                        <aside className="w-[320px] shrink-0 border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 overflow-y-auto p-6 space-y-8">

                            <section>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Meeting Link</label>
                                <div className={`bg-white dark:bg-slate-800 p-3 rounded-2xl border flex items-center gap-3 group transition-all shadow-sm
                  ${canEdit ? 'focus-within:ring-2 ring-indigo-500/10 border-slate-200 dark:border-slate-700' : 'border-transparent opacity-70'}
                `}>
                                    <FiLink className="text-slate-400 group-focus-within:text-indigo-500" />
                                    <input
                                        disabled={!canEdit}
                                        placeholder="https://zoom.us/..."
                                        value={link}
                                        onChange={e => setLink(e.target.value)}
                                        className="flex-1 bg-transparent border-none p-0 text-[11px] font-medium text-slate-600 dark:text-slate-300 focus:ring-0"
                                    />
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Participants</label>
                                    <div className="flex items-center gap-2">
                                        {canEdit && (
                                            <button
                                                onClick={toggleSelectAllParticipants}
                                                className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 lowercase tracking-tight border-b border-indigo-500/30"
                                            >
                                                {selectedParticipants.length === teamMembers.length ? 'unselect all' : 'select all'}
                                            </button>
                                        )}
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                                            {selectedParticipants.length} Joining
                                        </span>
                                    </div>
                                </div>

                                {canEdit && (
                                    <div className="relative mb-4">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                                        <input
                                            placeholder="Search team..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-300 dark:placeholder-slate-600"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar-thin pr-1">
                                    {teamMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map(member => {
                                        const isSelected = selectedParticipants.includes(member.id);
                                        return (
                                            <button
                                                key={member.id}
                                                disabled={!canEdit}
                                                onClick={() => toggleParticipant(member.id)}
                                                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all
                          ${isSelected ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                          ${!canEdit ? 'cursor-default' : 'cursor-pointer'}
                        `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.name}`}
                                                        className={`w-7 h-7 rounded-full object-cover shadow-sm ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                                                    />
                                                    <div className="text-left">
                                                        <span className={`block text-[11px] font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{member.name}</span>
                                                        <span className={`block text-[9px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>Available</span>
                                                    </div>
                                                </div>
                                                {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </aside>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="h-20 shrink-0 border-t border-slate-100 dark:border-slate-800 px-8 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            {canEdit && initialData && (
                                <button
                                    onClick={() => onDelete(initialData.id)}
                                    className="px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                    Delete Meeting
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
                            >
                                {canEdit ? 'Cancel' : 'Close'}
                            </button>

                            {canEdit && (
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <FiCheckCircle className="w-4 h-4" />
                                    )}
                                    {initialData ? 'Save Changes' : 'Schedule Meeting'}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
