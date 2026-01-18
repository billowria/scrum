import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMessageCircle, FiEdit3, FiSend } from 'react-icons/fi';

const CrownIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L9 9L1 6L4 14H20L23 6L15 9L12 1ZM4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16H4Z" />
    </svg>
);

const BossMessageComposer = ({ isOpen, onClose, onSubmit, mode = 'create', existingMessage }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const maxChars = 500;

    useEffect(() => {
        if (existingMessage?.content) {
            setMessage(existingMessage.content);
        } else {
            setMessage('');
        }
    }, [existingMessage, isOpen]);

    const handleSubmit = async () => {
        if (!message.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(message.trim());
            setMessage('');
            onClose();
        } catch (error) {
            console.error('Error submitting boss message:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="w-full max-w-xl rounded-[2.5rem] bg-white/90 dark:bg-slate-950/90 border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
                                    <CrownIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                        {mode === 'edit' ? 'Edit Announcement' : 'New Announcement'}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {mode === 'edit' ? 'Update your message to the team' : 'Broadcast to your entire team'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-all">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
                            placeholder="What's on your mind today?"
                            className="w-full h-48 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-amber-400 focus:outline-none text-lg text-gray-900 dark:text-white resize-none transition-all placeholder:text-gray-400"
                            autoFocus
                        />

                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm font-bold text-gray-400">
                                {message.length} <span className="text-gray-300">/</span> {maxChars}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="px-6 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!message.trim() || isSubmitting}
                                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-600 text-white font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 transition-all hover:shadow-amber-500/40"
                                >
                                    {isSubmitting ? 'Posting...' : mode === 'edit' ? 'Update Announcement' : 'Post Announcement'}
                                    <FiSend className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BossMessageComposer;
