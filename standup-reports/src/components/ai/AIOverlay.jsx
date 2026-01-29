import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiZap, FiCpu, FiCommand, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { HiSparkles, HiOutlineLightBulb, HiOutlineChartBarSquare, HiOutlineClipboardDocumentCheck, HiOutlineFire } from 'react-icons/hi2';
import { generateResponse } from '../../services/aiService';
import { supabase } from '../../supabaseClient';
import Avatar from '../shared/Avatar';

/**
 * AI Overlay V4 - Ultimate Premium Edition
 * Features:
 * - Glowy Snake Border Loader during processing
 * - HTTP Streaming Text Effect
 * - Full Light/Dark Mode Support
 * - Premium Icons & Micro-interactions
 */

const PRE_PROMPTS = [
    { icon: HiOutlineChartBarSquare, text: 'Team Analytics', query: 'Give me a summary of team analytics and performance', color: 'from-blue-500 to-cyan-400' },
    { icon: HiOutlineClipboardDocumentCheck, text: 'My Tasks', query: 'Show me my pending and incomplete tasks', color: 'from-emerald-500 to-teal-400' },
    { icon: HiOutlineFire, text: 'Urgent Items', query: 'What needs my immediate attention today?', color: 'from-orange-500 to-amber-400' },
    { icon: HiOutlineLightBulb, text: 'Sprint Status', query: 'Summarize the current sprint progress', color: 'from-purple-500 to-pink-400' },
];

// Streaming Text Component - Typewriter Effect
const StreamingText = ({ text, isStreaming }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedText(text);
            return;
        }

        setDisplayedText('');
        setCurrentIndex(0);
    }, [text, isStreaming]);

    useEffect(() => {
        if (!isStreaming || currentIndex >= text.length) return;

        const timer = setTimeout(() => {
            setDisplayedText(prev => prev + text[currentIndex]);
            setCurrentIndex(prev => prev + 1);
        }, 12); // Fast streaming speed

        return () => clearTimeout(timer);
    }, [currentIndex, text, isStreaming]);

    return (
        <span>
            {displayedText}
            {isStreaming && currentIndex < text.length && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
                />
            )}
        </span>
    );
};

// Snake Border Loader Component
const SnakeBorderLoader = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-50">
            {/* Gradient Border Mask */}
            <div
                className="absolute inset-0"
                style={{
                    padding: '3px',
                    background: 'transparent',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                }}
            >
                {/* Rotating Conic Gradient */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-[200%]"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0%, transparent 60%, #22d3ee 75%, #3b82f6 85%, #8b5cf6 95%, transparent 100%)',
                    }}
                />
            </div>

            {/* Outer Glow Effect */}
            <motion.div
                animate={{
                    boxShadow: [
                        '0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)',
                        '0 0 30px rgba(34, 211, 238, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)',
                        '0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)',
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-3xl"
            />
        </div>
    );
};

const AIOverlay = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [streamingMessageId, setStreamingMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 400);
        }
    }, [isOpen]);

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
        inputRef.current?.focus();
    };

    const clearChat = () => {
        setMessages([]);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await generateResponse(input, null, [...messages, userMsg]);
            const newMsgId = Date.now() + 1;
            setStreamingMessageId(newMsgId);

            setMessages(prev => [...prev, {
                id: newMsgId,
                role: 'assistant',
                content: response.text || "I'm here to help!"
            }]);

            // Stop streaming effect after text is fully displayed
            setTimeout(() => {
                setStreamingMessageId(null);
            }, (response.text?.length || 20) * 15 + 500);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: "I encountered an issue processing your request. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[99998] bg-black/50 dark:bg-black/70 backdrop-blur-md"
                    />

                    {/* GENIE CONTAINER */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0,
                            x: "40vw",
                            y: "-40vh",
                            borderRadius: "100px"
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: "-50%",
                            y: "-50%",
                            borderRadius: "24px"
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0,
                            x: "40vw",
                            y: "-40vh",
                            borderRadius: "100px",
                            transition: { duration: 0.25, ease: 'easeIn' }
                        }}
                        transition={{
                            type: 'spring',
                            damping: 28,
                            stiffness: 300,
                            mass: 0.9
                        }}
                        className="fixed left-1/2 top-1/2 z-[99999] overflow-visible"
                        style={{
                            width: 'min(92vw, 1100px)',
                            height: 'min(88vh, 850px)',
                        }}
                    >
                        {/* SNAKE BORDER LOADER */}
                        <SnakeBorderLoader isActive={isLoading} />

                        {/* Main Container */}
                        <div className="relative w-full h-full rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-white/10 flex flex-col overflow-hidden shadow-2xl dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.5)]">

                            {/* Ambient Glows - Light/Dark adaptive */}
                            <div className="absolute top-0 left-1/4 w-1/2 h-[200px] bg-gradient-to-b from-cyan-500/10 dark:from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-tl from-purple-500/10 dark:from-purple-500/5 to-transparent blur-3xl pointer-events-none" />

                            {/* ===== HEADER ===== */}
                            <div className="relative h-[72px] flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-gray-50/80 dark:from-slate-800/50 via-transparent to-gray-50/80 dark:to-slate-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    {/* AI Icon with Pulse */}
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 dark:shadow-blue-500/20">
                                            <HiSparkles className="text-white" size={22} />
                                        </div>
                                        {isLoading && (
                                            <motion.div
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 blur-md -z-10"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-2.5">
                                            Sync Intelligence
                                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 dark:from-cyan-500/20 dark:to-purple-500/20 border border-cyan-500/20 dark:border-cyan-400/30 text-[10px] text-cyan-600 dark:text-cyan-300 font-bold uppercase tracking-wider">
                                                Neural
                                            </span>
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                                            {isLoading ? (
                                                <motion.span
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="text-cyan-600 dark:text-cyan-400"
                                                >
                                                    ⚡ Processing your request...
                                                </motion.span>
                                            ) : (
                                                'Your intelligent workspace companion'
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {messages.length > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={clearChat}
                                            className="h-9 px-3 rounded-xl flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm font-medium"
                                        >
                                            <FiTrash2 size={14} />
                                            <span className="hidden sm:inline">Clear</span>
                                        </motion.button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* ===== CHAT AREA ===== */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,100,100,0.3) transparent' }}>

                                {/* Empty State */}
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                            className="text-center space-y-8 max-w-2xl"
                                        >
                                            {/* Hero Icon */}
                                            <div className="relative w-24 h-24 mx-auto">
                                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 dark:from-cyan-500/10 dark:to-purple-500/10 rounded-[2rem] blur-xl" />
                                                <div className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200/50 dark:border-white/10 flex items-center justify-center shadow-xl">
                                                    <FiZap size={40} className="text-cyan-500 dark:text-cyan-400" />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                                    What can I help with?
                                                </h2>
                                                <p className="text-gray-500 dark:text-slate-400 text-base max-w-md mx-auto">
                                                    Ask me about your tasks, team performance, project status, or anything in your workspace.
                                                </p>
                                            </div>

                                            {/* Pre-prompts Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                {PRE_PROMPTS.map((p, i) => (
                                                    <motion.button
                                                        key={i}
                                                        initial={{ opacity: 0, y: 15 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.25 + (i * 0.08) }}
                                                        onClick={() => handlePrePrompt(p)}
                                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 text-left"
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all`}>
                                                            <p.icon className="text-white" size={20} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                                            {p.text}
                                                        </span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {/* Messages */}
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* AI Avatar */}
                                        {msg.role !== 'user' && (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-blue-500/20">
                                                <HiSparkles className="text-white" size={18} />
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`max-w-[75%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-md shadow-lg shadow-cyan-500/20'
                                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 text-gray-800 dark:text-slate-200 rounded-tl-md'
                                            }`}>
                                            <p className="whitespace-pre-wrap">
                                                {msg.role === 'assistant' && streamingMessageId === msg.id ? (
                                                    <StreamingText text={msg.content} isStreaming={true} />
                                                ) : (
                                                    msg.content
                                                )}
                                            </p>
                                        </div>

                                        {/* User Avatar */}
                                        {msg.role === 'user' && (
                                            <div className="flex-shrink-0 mt-1">
                                                {currentUser ? (
                                                    <Avatar user={currentUser} size="md" className="ring-2 ring-white/20 dark:ring-white/10" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-white border border-gray-300/50 dark:border-white/10">
                                                        <FiCommand size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {/* Loading Indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <FiRefreshCw className="text-white" size={18} />
                                            </motion.div>
                                        </div>
                                        <div className="px-5 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-tl-md flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[0, 0.15, 0.3].map((delay, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                                        transition={{ duration: 0.8, repeat: Infinity, delay }}
                                                        className="w-2 h-2 rounded-full bg-cyan-500"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                                Analyzing...
                                            </span>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* ===== INPUT AREA ===== */}
                            <div className="relative p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
                                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-center gap-3">
                                    <div className="relative flex-1 group">
                                        {/* Input Glow on Focus */}
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Ask anything about your workspace..."
                                            disabled={isLoading}
                                            className="relative w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 focus:border-cyan-500/50 dark:focus:border-cyan-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-500/30 transition-all font-medium disabled:opacity-50"
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="h-[56px] px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center gap-2"
                                    >
                                        <span className="hidden sm:inline">Send</span>
                                        <FiSend size={18} className={isLoading ? 'animate-pulse' : ''} />
                                    </motion.button>
                                </form>

                                <div className="text-center mt-3">
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                        Powered by <span className="text-cyan-600 dark:text-cyan-400">Sync AI</span> • All queries are scoped to your workspace
                                    </p>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIOverlay;
