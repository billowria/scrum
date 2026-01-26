import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHash, FiCheckSquare, FiSearch } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

/**
 * Context Selector Popover
 * Allows users to search and select Tasks/Projects to attach to AI chat.
 * Triggered by typing '@' in the input.
 */
const ContextSelector = ({ query, onSelect, onClose }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        const fetchContext = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch Projects
                // RBAC: If member, only fetch assigned projects
                const projectsQuery = supabase
                    .from('projects')
                    .select('id, name')
                    .ilike('name', `%${query}%`)
                    .limit(5);

                // Fetch Tasks
                // RBAC: If member, only fetch assigned tasks (or tasks in assigned projects) -> simplified to assigned for now for speed
                const tasksQuery = supabase
                    .from('tasks')
                    .select('id, title, project:projects(name)')
                    .ilike('title', `%${query}%`)
                    .limit(5);

                const [projectsRes, tasksRes] = await Promise.all([projectsQuery, tasksQuery]);

                const formattedProjects = (projectsRes.data || []).map(p => ({
                    id: p.id,
                    type: 'project',
                    label: p.name,
                    icon: FiHash
                }));

                const formattedTasks = (tasksRes.data || []).map(t => ({
                    id: t.id,
                    type: 'task',
                    label: t.title,
                    subLabel: t.project?.name,
                    icon: FiCheckSquare
                }));

                setItems([...formattedProjects, ...formattedTasks]);
                setSelectedIndex(0);

            } catch (error) {
                console.error('Context fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchContext, 300); // Debounce
        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (items[selectedIndex]) {
                    onSelect(items[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, onSelect, onClose]);

    if (items.length === 0 && !loading) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 w-full mb-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
        >
            <div className="px-3 py-2 border-b border-white/5 text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Suggested Context</span>
                {loading && <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            <div className="max-h-60 overflow-y-auto p-1">
                {items.map((item, index) => (
                    <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => onSelect(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${index === selectedIndex
                                ? 'bg-cyan-500/20 text-white'
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                            <item.icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.label}</div>
                            {item.subLabel && (
                                <div className="text-[10px] text-slate-400 truncate">{item.subLabel}</div>
                            )}
                        </div>
                        {index === selectedIndex && (
                            <span className="text-[10px] text-cyan-400 font-mono">↵</span>
                        )}
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default ContextSelector;
