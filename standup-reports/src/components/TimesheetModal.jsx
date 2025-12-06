import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiCalendar, FiFileText, FiTrash2, FiSave, FiLayers, FiList } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { format } from 'date-fns';

const TimesheetModal = ({ isOpen, onClose, dates = [], currentUser, onSave, onDelete, initialData }) => {
    const { currentCompany } = useCompany();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        project_id: '',
        hours: 8,
        notes: ''
    });

    // Calculate sorted dates for display
    const sortedDates = [...dates].sort();
    const dateRangeString = sortedDates.length === 1
        ? format(new Date(sortedDates[0]), 'EEE, MMM d, yyyy')
        : `${sortedDates.length} Dates Selected`;

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            if (initialData) {
                setFormData({
                    project_id: initialData.project_id || '',
                    hours: initialData.hours || 8,
                    notes: initialData.notes || ''
                });
            } else {
                // Keep previous values if opening new, or reset?
                // Let's keep 8 hours default, but reset project/notes if fresh open without initialData
                // Actually for batch logic often we want to keep previous project.
                // For now simple reset if brand new.
                if (sortedDates.length > 0) {
                    setFormData(prev => ({
                        project_id: prev.project_id || '',
                        hours: 8,
                        notes: ''
                    }));
                }
            }
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        if (!currentCompany?.id) return;
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .eq('company_id', currentCompany.id)
                .eq('status', 'active')
                .order('name');

            if (error) throw error;
            setProjects(data || []);

            // Auto-select first project if none selected
            if (!formData.project_id && data && data.length > 0) {
                setFormData(prev => ({ ...prev, project_id: data[0].id }));
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || !currentCompany?.id) return;

        setLoading(true);
        try {
            // Loop through all selected dates and upsert
            const upsertData = dates.map(dateStr => ({
                user_id: currentUser.id,
                date: dateStr,
                project_id: formData.project_id,
                hours: parseFloat(formData.hours),
                notes: formData.notes,
                updated_at: new Date().toISOString()
                // If updating specific existing ID, we'd need that mapped. 
                // For batch mode, we typically overwrite for that day/user/project combination 
                // OR we just insert.
                // Given schema constraints (user_id, date, project_id, notes) unique... 
                // Be careful. Simple approach: We might be replacing existing entries or creating new ones.
                // Supabase upsert needs a Conflict target.
                // If we don't have a unique constraint on (user_id, date), we can have multiple entries per day.
                // That is allowed? "Unique constraint: (user_id, date, project_id, notes)"
                // This means we can have multiple entries for same day if project or notes differ.
            }));

            // NOTE: Because users might want to overwrite "whatever I did on these days", 
            // strict upsert is tricky without IDs.
            // If `initialData` is present (single edit mode), we update that specific ID.
            if (dates.length === 1 && initialData?.id) {
                const { error } = await supabase
                    .from('timesheets')
                    .update({
                        project_id: formData.project_id,
                        hours: parseFloat(formData.hours),
                        notes: formData.notes
                    })
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                // Bulk Insert Mode
                // If we want to strictly add new entries:
                const { error } = await supabase
                    .from('timesheets')
                    .insert(upsertData);
                if (error) throw error;
            }

            onSave(); // Refetch
            onClose();
        } catch (error) {
            console.error('Error saving timesheet:', error);
            alert('Error saving: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        // Only available for single edit mode with ID
        if (!initialData?.id || !confirm('Delete this entry?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('timesheets')
                .delete()
                .eq('id', initialData.id);

            if (error) throw error;

            onDelete(initialData.id);
            onClose();
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white relative shrink-0">
                                {/* Decorative background visual */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>

                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white z-20"
                                >
                                    <FiX size={18} />
                                </button>

                                <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10">
                                    <FiClock className="w-6 h-6" />
                                    {initialData ? 'Edit Entry' : 'Log Time'}
                                </h2>
                                <div className="flex items-center gap-2 text-violet-100 mt-2 relative z-10 font-medium">
                                    <FiCalendar size={16} />
                                    <span>{dateRangeString}</span>
                                </div>
                            </div>

                            {/* Date List (if multiple) */}
                            {dates.length > 1 && (
                                <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 shrink-0 max-h-32 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {sortedDates.map(d => (
                                            <span key={d} className="text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-md shadow-sm">
                                                {format(new Date(d), 'MMM d')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <div className="overflow-y-auto p-6 md:p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Project Select */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FiLayers className="w-4 h-4" /></div>
                                            Select Project
                                        </label>
                                        <select
                                            required
                                            value={formData.project_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white text-gray-700 font-medium"
                                        >
                                            <option value="" disabled>Choose a project...</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Hours Input */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><FiClock className="w-4 h-4" /></div>
                                                Duration
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0.1"
                                                    max="24"
                                                    step="0.1"
                                                    value={formData.hours}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white pl-12 font-mono text-xl font-bold text-gray-800"
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors font-medium text-sm mt-0.5">HRS</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <div className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"><FiFileText className="w-4 h-4" /></div>
                                            Description / Notes
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="What did you work on?"
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white resize-none text-gray-700"
                                        />
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-8">
                                        {initialData && dates.length === 1 ? (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={loading}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
                                            >
                                                <FiTrash2 /> Delete Entry
                                            </button>
                                        ) : (
                                            <div></div> /* Spacer */
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-semibold"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:transform-none"
                                            >
                                                {loading ? 'Saving...' : (
                                                    <>
                                                        <FiSave className="w-4 h-4" />
                                                        {dates.length > 1 ? `Log ${dates.length} Entries` : 'Save Entry'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TimesheetModal;
