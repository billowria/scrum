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

                    {/* FIXED SIZE CONTAINER - 500x600 - Sliding from top */}
                    <motion.div
                        initial={{ opacity: 0, y: -100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{ width: 450, height: 650 }}
                        className="fixed top-[70px] right-4 sm:right-6 lg:right-8 z-[99999] overflow-hidden"
                    >
                        {/* Snake Border Loader - Always visible on borders when loading */}
                        <div
                            className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0"
                            style={{
                                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                maskComposite: 'exclude',
                                WebkitMaskComposite: 'xor',
                                padding: '3px'
                            }}
                        >
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -inset-[100%]"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent 70%, #22d3ee 100%)',
                                            filter: 'drop-shadow(0 0 10px #22d3ee)'
                                        }}
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Main Card */}
                        <div
                            className={`relative h-full w-full rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 flex flex-col overflow-hidden m-[2px] transition-shadow duration-500 ${isLoading ? 'shadow-[0_0_50px_rgba(34,211,238,0.25)] border-cyan-400/30' : 'shadow-2xl'
                                }`}
                            style={{ height: 'calc(100% - 4px)', width: 'calc(100% - 4px)' }}
                        >
                            {/* Header - Fixed 60px */}
                            <div className="h-[60px] min-h-[60px] px-6 flex items-center justify-between border-b border-gray-200/60 dark:border-slate-700/60 bg-gradient-to-r from-cyan-500/15 via-transparent to-purple-500/15 backdrop-blur-md">
                                <div className="flex items-center gap-3.5">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform-gpu">
                                            <FiMessageCircle className="text-white" size={20} />
                                        </div>
                                        {isLoading && (
                                            <motion.div
                                                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute -inset-1.5 rounded-[1.25rem] border-2 border-cyan-400/30 blur-[2px]"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-[900] text-gray-900 dark:text-white text-[15px] tracking-tight leading-none">Sync Intelligence</h3>
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                                            {isLoading ? 'Synthesizing knowledge...' : 'Neural Engine Active'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 group"
                                >
                                    <FiX className="text-gray-500 group-hover:text-red-500 transition-colors" size={20} />
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
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                            className="text-5xl mb-3"
                                        >
                                            🌌
                                        </motion.div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Transmitting Knowledge...</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">How can I accelerate your workflow today?</p>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className="flex-shrink-0">
                                            {msg.role === 'user' ? (
                                                currentUser ? (
                                                    <Avatar user={currentUser} size="xs" className="ring-2 ring-purple-500/20" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">U</div>
                                                )
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">AI</div>
                                            )}
                                        </div>
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800/80 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-slate-700/50'
                                            }`}>
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">AI</div>
                                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl rounded-tl-none px-5 py-4 border border-gray-100 dark:border-slate-700/50 flex flex-col gap-3 min-w-[140px]">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-4 h-4">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Thinking</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <motion.div
                                                    animate={{
                                                        height: [4, 12, 4],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                                    className="w-1 bg-cyan-500 rounded-full"
                                                />
                                                <motion.div
                                                    animate={{
                                                        height: [4, 16, 4],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                                                    className="w-1 bg-purple-500 rounded-full"
                                                />
                                                <motion.div
                                                    animate={{
                                                        height: [4, 10, 4],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                                                    className="w-1 bg-blue-500 rounded-full"
                                                />
                                                <motion.div
                                                    animate={{
                                                        height: [4, 14, 4],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
                                                    className="w-1 bg-pink-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area - Fixed 80px */}
                            <div className="min-h-[80px] px-6 py-5 border-t border-gray-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
                                <form onSubmit={handleSubmit} className="flex gap-3 h-full items-center">
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Ask Sync Intelligence..."
                                            className="w-full px-5 py-3 rounded-2xl bg-gray-100/50 dark:bg-slate-800/50 border border-transparent focus:border-cyan-500/30 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400/80 text-[14px] font-medium transition-all duration-300 outline-none shadow-inner"
                                        />
                                        <div className="absolute inset-0 rounded-2xl border border-cyan-500/0 group-focus-within:border-cyan-500/20 pointer-events-none transition-colors duration-300" />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all duration-300 flex items-center justify-center shrink-0 border border-white/10"
                                    >
                                        <FiSend size={20} className={isLoading ? 'animate-pulse' : ''} />
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
