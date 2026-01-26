import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiMessageCircle } from 'react-icons/fi';
import { generateResponse } from '../../services/aiService';
import { supabase } from '../../supabaseClient';
import Avatar from '../shared/Avatar';

/**
 * Modern AI Chat Overlay V2 - Fixed Size, Premium Design
 * CRITICAL: Strictly 500x600 fixed dimensions with internal scroll
 */

const PRE_PROMPTS = [
    { emoji: '📊', text: 'Team analytics', query: 'Give me a summary of team analytics and performance' },
    { emoji: '✅', text: 'My tasks', query: 'Show me my pending and incomplete tasks' },
    { emoji: '🔥', text: 'Urgent items', query: 'What needs my immediate attention today?' },
    { emoji: '📈', text: 'Sprint status', query: 'Summarize the current sprint progress' },
];

const AIOverlay = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .eq('id', user.id)
                .single();
            setCurrentUser(profile);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handlePrePrompt = (prompt) => {
        setInput(prompt.query);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await generateResponse(input, null, [...messages, userMsg]);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.text || "I'm here to help!"
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: "Sorry, something went wrong. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-sm"
                    />

                    {/* FIXED SIZE CONTAINER - 500x600 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        style={{ width: 500, height: 600 }}
                        className="fixed bottom-24 right-6 z-[99999] overflow-hidden"
                    >
                        {/* Snake Border Loader */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -inset-[2px] rounded-2xl overflow-hidden pointer-events-none"
                                    style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.4)' }}
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent, transparent 60%, #22d3ee 80%, #a855f7 90%, transparent 100%)'
                                        }}
                                    />
                                    <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-slate-900" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Card - STRICT HEIGHT */}
                        <div
                            style={{ width: 500, height: 600 }}
                            className="relative rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden"
                        >
                            {/* Header - Fixed 60px */}
                            <div className="h-[60px] min-h-[60px] px-5 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <FiMessageCircle className="text-white" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Sync AI</h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Always ready to help</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <FiX className="text-gray-500" size={18} />
                                </button>
                            </div>

                            {/* Pre-prompts - Fixed 50px when empty */}
                            {messages.length === 0 && (
                                <div className="h-[50px] min-h-[50px] px-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                                    {PRE_PROMPTS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePrePrompt(p)}
                                            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-cyan-400 transition-all whitespace-nowrap"
                                        >
                                            {p.emoji} {p.text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Messages Area - FLEXIBLE with overflow scroll */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="text-5xl mb-3">💬</div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Hi there!</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">How can I assist you today?</p>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        {msg.role === 'user' ? (
                                            currentUser ? (
                                                <Avatar user={currentUser} size="xs" className="ring-0" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">U</div>
                                            )
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">S</div>
                                        )}
                                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white rounded-tr-sm'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-sm'
                                            }`}>
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">S</div>
                                        <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <div className="flex gap-1">
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-cyan-500 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 bg-purple-500 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 bg-cyan-500 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area - Fixed 70px */}
                            <div className="h-[70px] min-h-[70px] px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                                <form onSubmit={handleSubmit} className="flex gap-2.5 h-full">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask me anything..."
                                        className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
                                    >
                                        <FiSend size={16} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIOverlay;
