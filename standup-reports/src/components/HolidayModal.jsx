import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiCalendar, FiFileText, FiTrash2, FiSave } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { format } from 'date-fns';

const HolidayModal = ({ isOpen, onClose, date, currentUser, onSave, onDelete, initialData }) => {
    const { currentCompany } = useCompany();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    description: initialData.description || ''
                });
            } else {
                setFormData({ name: '', description: '' });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || !currentCompany?.id || !date) return;

        setLoading(true);
        try {
            if (initialData?.id) {
                // Update existing
                const { error } = await supabase
                    .from('holidays')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('holidays')
                    .insert({
                        company_id: currentCompany.id,
                        date: date,
                        name: formData.name,
                        description: formData.description,
                        created_by: currentUser.id
                    });
                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving holiday:', error);
            alert('Error saving: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !confirm('Delete this holiday?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('holidays')
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

    const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'admin';

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
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white z-20"
                                >
                                    <FiX size={18} />
                                </button>

                                <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10">
                                    <FiStar className="w-6 h-6" />
                                    {initialData ? 'Edit Holiday' : 'Add Holiday'}
                                </h2>
                                <div className="flex items-center gap-2 text-amber-100 mt-2 relative z-10 font-medium">
                                    <FiCalendar size={16} />
                                    <span>{date ? format(new Date(date), 'EEEE, MMM d, yyyy') : ''}</span>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><FiStar className="w-4 h-4" /></div>
                                            Holiday Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Christmas Day"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all bg-gray-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-white font-medium"
                                            disabled={!canEdit}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <div className="p-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg"><FiFileText className="w-4 h-4" /></div>
                                            Description (optional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Additional notes..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 outline-none transition-all bg-gray-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 resize-none text-gray-700 dark:text-white"
                                            disabled={!canEdit}
                                        />
                                    </div>

                                    {/* Action Bar */}
                                    {canEdit ? (
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                                            {initialData ? (
                                                <button
                                                    type="button"
                                                    onClick={handleDelete}
                                                    disabled={loading}
                                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
                                                >
                                                    <FiTrash2 /> Delete
                                                </button>
                                            ) : (
                                                <div></div>
                                            )}

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-semibold"
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70"
                                                >
                                                    {loading ? 'Saving...' : <><FiSave className="w-4 h-4" /> Save</>}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Only managers and admins can edit holidays.
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HolidayModal;
