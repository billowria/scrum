import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckSquare, FiChevronRight, FiX, FiLoader, FiCpu } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

/**
 * TaskContextPanel - Browse and attach tasks to AI chat
 * Shows user's assigned tasks with title + description for AI analysis
 */
const TaskContextPanel = ({ onSelectTask, onClose }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch user's profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('id, company_id')
                    .eq('id', user.id)
                    .single();

                if (!profile) return;

                // Fetch assigned tasks with title and description
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('id, title, description, status, priority, project:projects(name)')
                    .eq('assignee_id', profile.id)
                    .eq('company_id', profile.company_id)
                    .neq('status', 'done')
                    .order('updated_at', { ascending: false })
                    .limit(10);

                setTasks(tasksData || []);
            } catch (error) {
                console.error('TaskContextPanel fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    const handleAnalyze = () => {
        if (selectedTask) {
            onSelectTask({
                type: 'task',
                id: selectedTask.id,
                label: selectedTask.title,
                title: selectedTask.title,
                description: selectedTask.description,
                project: selectedTask.project?.name
            });
        }
    };

    const priorityColors = {
        critical: 'text-red-400',
        high: 'text-orange-400',
        medium: 'text-yellow-400',
        low: 'text-green-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-y-0 right-0 w-72 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FiCheckSquare className="text-cyan-400" />
                    My Tasks
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                    <FiX size={16} />
                </button>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <FiLoader className="animate-spin text-cyan-400" size={20} />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active tasks assigned
                    </div>
                ) : (
                    tasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedTask?.id === task.id
                                    ? 'bg-cyan-500/20 border border-cyan-500/30'
                                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                <FiCheckSquare className={`mt-0.5 flex-shrink-0 ${priorityColors[task.priority] || 'text-gray-400'}`} size={14} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{task.title}</div>
                                    {task.project?.name && (
                                        <div className="text-[10px] text-gray-500 truncate">{task.project.name}</div>
                                    )}
                                </div>
                                {selectedTask?.id === task.id && (
                                    <FiChevronRight className="text-cyan-400 flex-shrink-0" size={14} />
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Selected Task Preview & Action */}
            <AnimatePresence>
                {selectedTask && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-4 border-t border-white/10 bg-slate-800/50"
                    >
                        <div className="text-xs text-gray-400 mb-2">Selected Task</div>
                        <div className="text-sm text-white font-medium mb-2 line-clamp-2">{selectedTask.title}</div>
                        {selectedTask.description && (
                            <div className="text-xs text-gray-400 mb-3 line-clamp-3">{selectedTask.description}</div>
                        )}
                        <button
                            onClick={handleAnalyze}
                            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-cyan-500 hover:to-blue-500 transition-all"
                        >
                            <FiCpu size={14} />
                            Ask Sync to Analyze
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TaskContextPanel;
