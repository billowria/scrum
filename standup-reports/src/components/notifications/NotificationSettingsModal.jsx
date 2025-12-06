import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiBell, FiMail, FiSmartphone } from 'react-icons/fi';
import notificationService from '../../services/notificationService'; // Fixed import path

const NotificationSettingsModal = ({ isOpen, onClose, userId }) => {
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({});
    const [saving, setSaving] = useState(false);

    // Categories to manage
    const categories = [
        { id: 'communication', label: 'Communication', description: 'Announcements, messages, team updates' },
        { id: 'task', label: 'Tasks', description: 'Task assignments, updates, comments' },
        { id: 'system', label: 'System', description: 'Security alerts, maintenance, billing' },
        { id: 'achievement', label: 'Achievements', description: 'Badges, milestones, recognitions' },
    ];

    useEffect(() => {
        if (isOpen && userId) {
            loadPreferences();
        }
    }, [isOpen, userId]);

    const loadPreferences = async () => {
        setLoading(true);
        const prefs = await notificationService.getUserPreferences(userId);
        setPreferences(prefs);
        setLoading(false);
    };

    const handleToggle = (category, channel) => {
        setPreferences(prev => {
            const currentCategory = prev[category] || { email: true, in_app: true, push: false };
            return {
                ...prev,
                [category]: {
                    ...currentCategory,
                    [channel]: !currentCategory[channel]
                }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save each category
            const updates = categories.map(cat => {
                const pref = preferences[cat.id] || { email: true, in_app: true, push: false };
                return notificationService.updateUserPreferences(userId, cat.id, pref);
            });
            await Promise.all(updates);
            onClose();
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Notification Settings</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-4 gap-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                            <div className="col-span-1 text-left">Category</div>
                            <div>Email</div>
                            <div>In-App</div>
                            <div>Push</div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            categories.map(cat => {
                                const pref = preferences[cat.id] || { email: true, in_app: true, push: false };
                                return (
                                    <div key={cat.id} className="grid grid-cols-4 gap-4 items-center py-4 border-b border-gray-50 last:border-0">
                                        <div className="col-span-1">
                                            <div className="font-medium text-gray-900 text-sm">{cat.label}</div>
                                            <div className="text-xs text-gray-400 line-clamp-1" title={cat.description}>{cat.description}</div>
                                        </div>

                                        {/* Toggles */}
                                        <div className="flex justify-center">
                                            <Toggle
                                                checked={pref.email}
                                                onChange={() => handleToggle(cat.id, 'email')}
                                                icon={FiMail}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Toggle
                                                checked={pref.in_app}
                                                onChange={() => handleToggle(cat.id, 'in_app')}
                                                icon={FiBell}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Toggle
                                                checked={pref.push}
                                                onChange={() => handleToggle(cat.id, 'push')}
                                                icon={FiSmartphone}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
                        >
                            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const Toggle = ({ checked, onChange, icon: Icon }) => (
    <button
        onClick={onChange}
        className={`
      w-12 h-7 rounded-full transition-colors duration-200 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      ${checked ? 'bg-blue-600' : 'bg-gray-200'}
    `}
    >
        <span
            className={`
        absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 flex items-center justify-center
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
        >
            {Icon && <Icon className={`w-3 h-3 ${checked ? 'text-blue-600' : 'text-gray-400'}`} />}
        </span>
    </button>
);

export default NotificationSettingsModal;
