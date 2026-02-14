import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiFolder,
    FiTarget,
    FiUsers,
    FiCalendar,
    FiChevronDown,
    FiX,
    FiCheck,
    FiGrid,
    FiClock,
    FiTrendingUp,
    FiAlertCircle,
    FiCheckCircle,
    FiFlag,
    FiZap,
    FiUser,
    FiSearch,
    FiSliders
} from 'react-icons/fi';

// ─── Dropdown (click-outside, portal-style z-index) ────────────────────────
const FilterDropdown = ({ trigger, children, isOpen, onToggle, onClose, width = 'w-64', align = 'left' }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={ref}>
            <div onClick={onToggle}>{trigger}</div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        className={`absolute z-[999] mt-2.5 ${width} ${align === 'right' ? 'right-0' : 'left-0'} rounded-2xl py-1.5 max-h-80 overflow-y-auto backdrop-blur-2xl`}
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.04)'
                        }}
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 rounded-full" />
                        <div className="pt-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Dropdown option ───────────────────────────────────────────────────────
const DropdownOption = ({ label, isActive, onClick, icon: Icon, image, badge, indent = false }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ backgroundColor: isActive ? undefined : 'rgba(99, 102, 241, 0.06)' }}
        className={`w-full px-4 py-2.5 text-left text-[13px] transition-all rounded-xl mx-1 flex items-center gap-2.5 ${indent ? 'pl-9' : ''} ${isActive
            ? 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/20 text-indigo-700 dark:text-indigo-300 font-semibold'
            : 'text-gray-600 dark:text-gray-300 font-medium hover:text-gray-900'
            }`}
    >
        {image ? (
            <img src={image} alt="" className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-sm" />
        ) : Icon ? (
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
        ) : null}
        <span className="truncate flex-1">{label}</span>
        {badge && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md ring-1 ring-emerald-200/60">
                {badge}
            </span>
        )}
        {isActive && (
            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-300/50">
                <FiCheck className="w-2.5 h-2.5 text-white" />
            </div>
        )}
    </motion.button>
);

// ─── Filter chip trigger button ────────────────────────────────────────────
const FilterChipButton = ({ label, icon: Icon, isActive, hasValue, onClick, gradient }) => {
    const defaultGradient = 'from-gray-50 to-gray-100/80 dark:from-slate-800 dark:to-slate-800/80';
    const activeGradient = gradient || 'from-indigo-500 to-violet-500';

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${hasValue || isActive
                ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20`
                : `bg-gradient-to-b ${defaultGradient} text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/80 dark:ring-slate-700/60 hover:ring-indigo-300/60 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm`
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap max-w-[120px] truncate">{label}</span>
            <FiChevronDown className={`w-3 h-3 transition-transform duration-200 ${isActive ? 'rotate-180' : ''} ${hasValue ? 'opacity-80' : 'opacity-50'}`} />
        </motion.button>
    );
};

// ─── Removable active filter chip ──────────────────────────────────────────
const ActiveFilterChip = ({ label, onRemove, gradient }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8, x: -8 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: -8 }}
        className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r ${gradient} text-white shadow-sm ring-1 ring-white/20`}
    >
        <span>{label}</span>
        <button
            onClick={onRemove}
            className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
            <FiX className="w-2.5 h-2.5" />
        </button>
    </motion.div>
);

// ─── Status pill row ───────────────────────────────────────────────────────
const StatusPillRow = ({ currentStatus, onStatusChange }) => {
    const statuses = [
        { id: 'all', label: 'All', icon: FiGrid },
        { id: 'To Do', label: 'To Do', icon: FiClock },
        { id: 'In Progress', label: 'Active', icon: FiTrendingUp },
        { id: 'Review', label: 'Review', icon: FiAlertCircle },
        { id: 'Completed', label: 'Done', icon: FiCheckCircle }
    ];

    return (
        <div className="flex items-center rounded-xl p-0.5 gap-0.5 ring-1 ring-gray-200/60 dark:ring-slate-700/50 bg-gray-100/60 dark:bg-slate-800/40">
            {statuses.map((s) => {
                const isActive = currentStatus === s.id;
                return (
                    <motion.button
                        key={s.id}
                        onClick={() => onStatusChange(s.id)}
                        whileTap={{ scale: 0.95 }}
                        className={`relative px-3 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${isActive
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-md ring-1 ring-gray-200/50 dark:ring-slate-600/50'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <s.icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{s.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
};

const priorityConfig = {
    High: { emoji: '🔴', gradient: 'from-rose-500 to-red-500' },
    Medium: { emoji: '🟡', gradient: 'from-amber-400 to-orange-500' },
    Low: { emoji: '🔵', gradient: 'from-blue-400 to-cyan-500' }
};

const dueDatePresets = [
    { id: 'all', label: 'Any Date', icon: FiCalendar },
    { id: 'overdue', label: 'Overdue', icon: FiAlertCircle },
    { id: 'today', label: 'Due Today', icon: FiClock },
    { id: 'week', label: 'This Week', icon: FiCalendar },
    { id: 'month', label: 'This Month', icon: FiCalendar },
    { id: 'none', label: 'No Due Date', icon: FiX }
];


// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function InlineFilterBar({
    projects = [],
    selectedProjectId,
    setSelectedProjectId,
    filters,
    setFilters,
    sprints = [],
    selectedSprintId,
    setSelectedSprintId,
    employees = [],
    currentUser,
    onClearAllFilters,
}) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    const toggle = (name) => setOpenDropdown(prev => prev === name ? null : name);
    const close = () => setOpenDropdown(null);

    // ─── Derived state ────────────────────────────────────────────────────────
    const selectedAssigneeIds = useMemo(() => {
        if (Array.isArray(filters.assignee)) return filters.assignee;
        if (filters.assignee && filters.assignee !== 'all') return [filters.assignee];
        return [];
    }, [filters.assignee]);

    const toggleAssignee = (empId) => {
        const current = [...selectedAssigneeIds];
        const idx = current.indexOf(empId);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(empId);
        setFilters({ ...filters, assignee: current.length === 0 ? 'all' : current });
    };

    const filteredEmployees = useMemo(() => {
        if (!assigneeSearch.trim()) return employees;
        const q = assigneeSearch.toLowerCase();
        return employees.filter(e => e.name?.toLowerCase().includes(q));
    }, [employees, assigneeSearch]);

    const sprintGroups = useMemo(() => {
        const groups = { Active: [], Planning: [], Completed: [] };
        sprints.forEach(s => {
            const key = s.status || 'Planning';
            if (groups[key]) groups[key].push(s);
            else groups.Planning.push(s);
        });
        return groups;
    }, [sprints]);

    const selectedPriorities = useMemo(() => {
        if (!filters.priority || filters.priority === 'all') return [];
        if (Array.isArray(filters.priority)) return filters.priority;
        return [filters.priority];
    }, [filters.priority]);

    const togglePriority = (p) => {
        const current = [...selectedPriorities];
        const idx = current.indexOf(p);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(p);
        setFilters({ ...filters, priority: current.length === 0 ? 'all' : current });
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedProjectId && selectedProjectId !== 'all') count++;
        if (filters.status && filters.status !== 'all') count++;
        if (selectedSprintId && selectedSprintId !== 'all') count++;
        if (selectedAssigneeIds.length > 0) count++;
        if (selectedPriorities.length > 0) count++;
        if (filters.dueDate && filters.dueDate !== 'all') count++;
        return count;
    }, [selectedProjectId, filters.status, selectedSprintId, selectedAssigneeIds, selectedPriorities, filters.dueDate]);

    // ─── Quick presets ────────────────────────────────────────────────────────
    const quickPresets = useMemo(() => [
        {
            id: 'my-tasks',
            label: 'My Tasks',
            icon: FiUser,
            isActive: selectedAssigneeIds.length === 1 && selectedAssigneeIds[0] === currentUser?.id,
            apply: () => {
                if (currentUser?.id) setFilters({ ...filters, assignee: [currentUser.id] });
            }
        },
        {
            id: 'overdue',
            label: 'Overdue',
            icon: FiAlertCircle,
            isActive: filters.dueDate === 'overdue',
            apply: () => setFilters({ ...filters, dueDate: filters.dueDate === 'overdue' ? 'all' : 'overdue' })
        },
        {
            id: 'high-priority',
            label: 'Urgent',
            icon: FiFlag,
            isActive: selectedPriorities.length === 1 && selectedPriorities[0] === 'High',
            apply: () => setFilters({ ...filters, priority: (selectedPriorities.length === 1 && selectedPriorities[0] === 'High') ? 'all' : ['High'] })
        }
    ], [filters, selectedAssigneeIds, selectedPriorities, currentUser]);

    // ─── Active chips ─────────────────────────────────────────────────────────
    const activeChips = useMemo(() => {
        const chips = [];
        if (selectedProjectId && selectedProjectId !== 'all') {
            const proj = projects.find(p => p.id === selectedProjectId);
            chips.push({ id: 'project', label: proj?.name || 'Project', gradient: 'from-indigo-500 to-violet-500', onRemove: () => setSelectedProjectId('all') });
        }
        if (filters.status && filters.status !== 'all') {
            chips.push({ id: 'status', label: filters.status, gradient: 'from-amber-500 to-orange-500', onRemove: () => setFilters({ ...filters, status: 'all' }) });
        }
        if (selectedSprintId && selectedSprintId !== 'all') {
            const sprint = sprints.find(s => s.id === selectedSprintId);
            chips.push({ id: 'sprint', label: sprint?.name || 'Sprint', gradient: 'from-fuchsia-500 to-pink-500', onRemove: () => setSelectedSprintId('all') });
        }
        if (selectedAssigneeIds.length > 0) {
            const names = employees.filter(e => selectedAssigneeIds.includes(e.id)).map(e => e.name);
            chips.push({ id: 'assignee', label: names.length <= 2 ? names.join(', ') : `${names.length} people`, gradient: 'from-emerald-500 to-teal-500', onRemove: () => setFilters({ ...filters, assignee: 'all' }) });
        }
        if (selectedPriorities.length > 0) {
            chips.push({ id: 'priority', label: selectedPriorities.join(', '), gradient: 'from-rose-500 to-red-500', onRemove: () => setFilters({ ...filters, priority: 'all' }) });
        }
        if (filters.dueDate && filters.dueDate !== 'all') {
            const preset = dueDatePresets.find(d => d.id === filters.dueDate);
            chips.push({ id: 'dueDate', label: preset?.label || filters.dueDate, gradient: 'from-sky-500 to-blue-500', onRemove: () => setFilters({ ...filters, dueDate: 'all' }) });
        }
        return chips;
    }, [selectedProjectId, filters, selectedSprintId, selectedAssigneeIds, selectedPriorities, projects, sprints, employees]);

    // ═══════════════════════════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div
            className="relative z-[100] rounded-2xl p-4 backdrop-blur-2xl"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.92) 50%, rgba(255,255,255,0.88) 100%)',
                border: '1px solid rgba(226, 232, 240, 0.6)',
                boxShadow: '0 8px 32px -4px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8) inset, 0 1px 2px rgba(0,0,0,0.02)'
            }}
        >
            {/* Subtle top accent gradient */}
            <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-indigo-500/0 via-indigo-400/30 to-violet-500/0 rounded-full" />

            <div className="space-y-3">
                {/* ─── Row 1: Presets + Status Pills + Dropdowns ───────────────────── */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5">
                        {quickPresets.map(preset => (
                            <motion.button
                                key={preset.id}
                                onClick={preset.apply}
                                whileHover={{ scale: 1.04, y: -1 }}
                                whileTap={{ scale: 0.96 }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-200 ${preset.isActive
                                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-lg shadow-gray-900/20 ring-1 ring-white/10'
                                    : 'bg-gray-100/80 dark:bg-slate-800/60 text-gray-500 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-slate-700/60 ring-1 ring-transparent hover:ring-gray-300/50'
                                    }`}
                            >
                                <preset.icon className="w-3 h-3" />
                                <span className="hidden lg:inline">{preset.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-gradient-to-b from-transparent via-gray-300/60 to-transparent mx-1.5 hidden md:block" />

                    {/* Status pills */}
                    <StatusPillRow
                        currentStatus={filters.status}
                        onStatusChange={(status) => setFilters({ ...filters, status })}
                    />

                    <div className="w-px h-5 bg-gradient-to-b from-transparent via-gray-300/60 to-transparent mx-1.5 hidden md:block" />

                    {/* ─── Filter Dropdowns ──────────────────────────────────────────── */}

                    {/* Project */}
                    <FilterDropdown
                        isOpen={openDropdown === 'project'}
                        onToggle={() => toggle('project')}
                        onClose={close}
                        trigger={
                            <FilterChipButton
                                label={selectedProjectId !== 'all' && selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name || 'Project' : 'Project'}
                                icon={FiFolder}
                                isActive={openDropdown === 'project'}
                                hasValue={selectedProjectId && selectedProjectId !== 'all'}
                                gradient="from-indigo-500 to-violet-500"
                            />
                        }
                    >
                        <DropdownOption label="All Projects" icon={FiGrid} isActive={selectedProjectId === 'all' || !selectedProjectId} onClick={() => { setSelectedProjectId('all'); close(); }} />
                        <div className="h-px bg-gray-100 mx-4 my-1" />
                        {projects.map(p => (
                            <DropdownOption key={p.id} label={p.name} icon={FiFolder} isActive={selectedProjectId === p.id} onClick={() => { setSelectedProjectId(p.id); close(); }} />
                        ))}
                    </FilterDropdown>

                    {/* Sprint */}
                    <FilterDropdown
                        isOpen={openDropdown === 'sprint'}
                        onToggle={() => toggle('sprint')}
                        onClose={close}
                        trigger={
                            <FilterChipButton
                                label={selectedSprintId !== 'all' ? sprints.find(s => s.id === selectedSprintId)?.name || 'Sprint' : 'Sprint'}
                                icon={FiTarget}
                                isActive={openDropdown === 'sprint'}
                                hasValue={selectedSprintId !== 'all'}
                                gradient="from-fuchsia-500 to-pink-500"
                            />
                        }
                    >
                        <DropdownOption label="All Sprints" icon={FiZap} isActive={selectedSprintId === 'all'} onClick={() => { setSelectedSprintId('all'); close(); }} />
                        {Object.entries(sprintGroups).map(([group, items]) =>
                            items.length > 0 && (
                                <div key={group}>
                                    <div className="px-4 pt-2.5 pb-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{group}</div>
                                    {items.map(s => (
                                        <DropdownOption key={s.id} label={s.name} icon={FiTarget} isActive={selectedSprintId === s.id} onClick={() => { setSelectedSprintId(s.id); close(); }} badge={s.status === 'Active' ? 'Active' : null} indent />
                                    ))}
                                </div>
                            )
                        )}
                    </FilterDropdown>

                    {/* Assignee */}
                    <FilterDropdown
                        isOpen={openDropdown === 'assignee'}
                        onToggle={() => { toggle('assignee'); setAssigneeSearch(''); }}
                        onClose={close}
                        trigger={
                            <FilterChipButton
                                label={selectedAssigneeIds.length === 0 ? 'Assignee' : selectedAssigneeIds.length === 1 ? employees.find(e => e.id === selectedAssigneeIds[0])?.name || 'Assignee' : `${selectedAssigneeIds.length} Selected`}
                                icon={FiUsers}
                                isActive={openDropdown === 'assignee'}
                                hasValue={selectedAssigneeIds.length > 0}
                                gradient="from-emerald-500 to-teal-500"
                            />
                        }
                    >
                        {employees.length > 5 && (
                            <div className="px-3 pt-2 pb-1">
                                <div className="relative">
                                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={assigneeSearch}
                                        onChange={(e) => setAssigneeSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg bg-gray-50 text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}
                        <DropdownOption label="All Assignees" icon={FiUsers} isActive={selectedAssigneeIds.length === 0} onClick={() => { setFilters({ ...filters, assignee: 'all' }); close(); }} />
                        <div className="h-px bg-gray-100 mx-4 my-1" />
                        {filteredEmployees.map(emp => (
                            <DropdownOption key={emp.id} label={emp.name} image={emp.avatar_url} icon={!emp.avatar_url ? FiUser : null} isActive={selectedAssigneeIds.includes(emp.id)} onClick={() => toggleAssignee(emp.id)} />
                        ))}
                    </FilterDropdown>

                    {/* Priority */}
                    <FilterDropdown
                        isOpen={openDropdown === 'priority'}
                        onToggle={() => toggle('priority')}
                        onClose={close}
                        width="w-52"
                        trigger={
                            <FilterChipButton
                                label={selectedPriorities.length === 0 ? 'Priority' : selectedPriorities.length === 1 ? selectedPriorities[0] : `${selectedPriorities.length} Sel.`}
                                icon={FiFlag}
                                isActive={openDropdown === 'priority'}
                                hasValue={selectedPriorities.length > 0}
                                gradient="from-rose-500 to-red-500"
                            />
                        }
                    >
                        <DropdownOption label="Any Priority" icon={FiFlag} isActive={selectedPriorities.length === 0} onClick={() => { setFilters({ ...filters, priority: 'all' }); close(); }} />
                        <div className="h-px bg-gray-100 mx-4 my-1" />
                        {['High', 'Medium', 'Low'].map(p => (
                            <motion.button
                                key={p}
                                onClick={() => togglePriority(p)}
                                whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.06)' }}
                                className={`w-full px-4 py-2.5 text-left text-[13px] transition-all rounded-xl mx-1 flex items-center gap-2.5 ${selectedPriorities.includes(p)
                                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-semibold'
                                    : 'text-gray-600 font-medium'
                                    }`}
                            >
                                <span className="text-sm">{priorityConfig[p].emoji}</span>
                                <span className="flex-1">{p}</span>
                                {selectedPriorities.includes(p) && (
                                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                        <FiCheck className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </FilterDropdown>

                    {/* Due Date */}
                    <FilterDropdown
                        isOpen={openDropdown === 'dueDate'}
                        onToggle={() => toggle('dueDate')}
                        onClose={close}
                        width="w-52"
                        trigger={
                            <FilterChipButton
                                label={filters.dueDate && filters.dueDate !== 'all' ? dueDatePresets.find(d => d.id === filters.dueDate)?.label || 'Due Date' : 'Due Date'}
                                icon={FiCalendar}
                                isActive={openDropdown === 'dueDate'}
                                hasValue={filters.dueDate && filters.dueDate !== 'all'}
                                gradient="from-sky-500 to-blue-500"
                            />
                        }
                    >
                        {dueDatePresets.map(d => (
                            <DropdownOption
                                key={d.id}
                                label={d.label}
                                icon={d.icon}
                                isActive={filters.dueDate === d.id || (!filters.dueDate && d.id === 'all')}
                                onClick={() => { setFilters({ ...filters, dueDate: d.id }); close(); }}
                            />
                        ))}
                    </FilterDropdown>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Clear all */}
                    <AnimatePresence>
                        {activeFilterCount > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClearAllFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200/60 transition-all shadow-sm"
                            >
                                <FiX className="w-3 h-3" />
                                Clear ({activeFilterCount})
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── Row 2: Active filter chips ──────────────────────────────────── */}
                <AnimatePresence>
                    {activeChips.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap gap-1.5 pt-1"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 self-center mr-1">Active:</span>
                            {activeChips.map(chip => (
                                <ActiveFilterChip
                                    key={chip.id}
                                    label={chip.label}
                                    gradient={chip.gradient}
                                    onRemove={chip.onRemove}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
