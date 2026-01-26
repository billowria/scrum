import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMinimize2, FiCpu, FiUser, FiZap, FiArrowRight, FiX, FiPaperclip } from 'react-icons/fi';
import { generateResponse } from '../../services/aiService';
import { useStreamingText } from '../../hooks/useStreamingText';
import { supabase } from '../../supabaseClient';
import Avatar from '../shared/Avatar';
import ContextSelector from './ContextSelector';
import TaskContextPanel from './TaskContextPanel';

/**
 * Message component with streaming text support
 */
const StreamingMessage = ({ content, isLatest }) => {
    // Only stream if it's the latest AI message, otherwise show full text immediately
    const { displayedText, isTyping } = useStreamingText(content, isLatest ? 20 : 0);

    // Fallback if hook isn't behaving as expected or for older messages
    const textToShow = isLatest ? displayedText : content;

    return (
        <div className="relative">
            <div dangerouslySetInnerHTML={{ __html: textToShow.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
            {isLatest && isTyping && (
                <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-cyan-400 animate-pulse" />
            )}
        </div>
    );
};

/**
 * "Nano Banana" AI Chat Screen
 * 
 * Design Specs:
 * - Dimensions: 500px width, 85vh height
 * - "Ultra-Glass" aesthetic
 * - Cinematic Header
 * - Fluid Message Bubbles
 */

const AIOverlay = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'assistant', content: "System Online.\nHello! I'm **Sync**. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // Full user profile for Avatar

    // Context Attachment State
    const [showContextSelector, setShowContextSelector] = useState(false);
    const [contextQuery, setContextQuery] = useState('');
    const [activeContext, setActiveContext] = useState(null); // { type: 'task'|'project', id, label, description }
    const [showTaskPanel, setShowTaskPanel] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch full profile for Avatar component
            const { data: profile } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                setCurrentUser(profile);
                setUserAvatar(profile.avatar_url);
            }
        };
        getUser();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle Input Changes for Context Trigger
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);

        // Check for '@' trigger
        const match = val.match(/@(\w*)$/);
        if (match && !activeContext) {
            setShowContextSelector(true);
            setContextQuery(match[1]);
        } else {
            setShowContextSelector(false);
        }
    };

    const handleContextSelect = (item) => {
        setActiveContext(item);
        setShowContextSelector(false);
        // Remove the '@query' part and add a space
        const newInput = input.replace(/@\w*$/, '').trim() + ' ';
        setInput(newInput);
    };

    const removeContext = () => {
        setActiveContext(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: input,
            context: activeContext // Store context in message history
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const attachedContext = activeContext; // Snapshot before clearing
        setActiveContext(null);
        setIsLoading(true);

        try {
            // Pass activeContext to the service
            const response = await generateResponse(input, attachedContext, [...messages, userMsg]);

            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.text || "I processed that request."
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: "Sorry, I encountered an issue. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (Click to close) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[99998] bg-black/20 backdrop-blur-[2px]"
                    />

                    {/* Main Chat Panel */}
                    <motion.div
                        initial={{ x: 100, opacity: 0, scale: 0.95 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        // INCREASED WIDTH: max-w-[600px]
                        className="fixed bottom-24 right-6 w-full max-w-[600px] h-[85vh] max-h-[900px] z-[99999] origin-bottom-right"
                    >
                        {/* Animated Snake Border - Visible only when loading */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -inset-[2px] rounded-[34px] z-0 overflow-hidden"
                                    style={{ boxShadow: '0 0 30px 5px rgba(34, 211, 238, 0.3)' }}
                                >
                                    {/* The rotating conic gradient creates the "snake" */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent, transparent 60%, rgba(34, 211, 238, 0.2) 70%, #22d3ee 85%, #3b82f6 92%, transparent 100%)',
                                        }}
                                    />
                                    {/* Trail glow effect */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 blur-sm"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent, transparent 75%, #22d3ee 90%, transparent 100%)',
                                        }}
                                    />
                                    {/* Inner mask to create the "border" effect - cutout the center */}
                                    <div className="absolute inset-[2px] rounded-[32px] bg-slate-900" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="w-full h-full rounded-[32px] overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative z-10">

                            {/* --- 1. Cinematic Header --- */}
                            <div className="relative h-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/5 flex items-center justify-between px-6 z-20">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                        <FiCpu className="text-white w-5 h-5" />
                                        {/* Pulsing Ring */}
                                        <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent tracking-tight">Sync</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">System Online</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowTaskPanel(!showTaskPanel)}
                                        className={`p-2 rounded-full transition-colors ${showTaskPanel ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                                        title="Browse Tasks"
                                    >
                                        <FiPaperclip size={18} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FiMinimize2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* --- 2. Chat Area --- */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-black/20">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        {msg.role === 'user' ? (
                                            currentUser ? (
                                                <Avatar user={currentUser} size="sm" className="ring-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                                                    <FiUser size={14} className="text-white" />
                                                </div>
                                            )
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                                <FiZap size={14} className="text-white" />
                                            </div>
                                        )}

                                        {/* Bubble */}
                                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-md ${msg.role === 'user'
                                            ? 'bg-white/10 text-white border border-white/10 rounded-tr-none'
                                            : 'bg-black/40 text-gray-200 border border-white/5 rounded-tl-none'
                                            }`}>
                                            {/* Show Context Chip if message had one */}
                                            {msg.context && (
                                                <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/20 text-xs font-semibold border border-white/10">
                                                    <span className="opacity-70">Reference:</span>
                                                    {msg.context.label}
                                                </div>
                                            )}

                                            {msg.role === 'assistant' ? (
                                                <StreamingMessage
                                                    content={msg.content}
                                                    isLatest={index === messages.length - 1 && !isLoading}
                                                />
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        {msg.role === 'assistant' && (
                                            <span className="text-[9px] text-cyan-500/50 font-mono absolute -bottom-4 left-14">sync</span>
                                        )}
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 text-gray-400 text-xs ml-12"
                                    >
                                        <div className="flex gap-1">
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                        </div>
                                        Thinking...
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* --- 3. Floating Input Bar --- */}
                            <div className="p-5 bg-gradient-to-t from-slate-900 to-transparent relative">

                                <AnimatePresence>
                                    {showContextSelector && (
                                        <ContextSelector
                                            query={contextQuery}
                                            onSelect={handleContextSelect}
                                            onClose={() => setShowContextSelector(false)}
                                        />
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />

                                    <div className="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex flex-col gap-2 shadow-2xl">

                                        <AnimatePresence>
                                            {activeContext && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="px-3 pt-2"
                                                >
                                                    <div className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                                                        <span>Attached: {activeContext.label}</span>
                                                        <button
                                                            type="button"
                                                            onClick={removeContext}
                                                            className="p-0.5 hover:bg-white/10 rounded"
                                                        >
                                                            <FiX size={12} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex items-end gap-2">
                                            <textarea
                                                value={input}
                                                onChange={handleInputChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        if (showContextSelector) return;
                                                        e.preventDefault();
                                                        handleSubmit(e);
                                                    }
                                                }}
                                                placeholder="Ask anything... (Type '@' to attach context)"
                                                className="w-full bg-transparent border-none text-white placeholder-gray-500 px-4 py-3 max-h-32 min-h-[50px] resize-none focus:ring-0 text-sm scrollbar-hide"
                                            />

                                            <button
                                                type="submit"
                                                disabled={!input.trim() || isLoading}
                                                className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
                                            >
                                                {isLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <FiArrowRight size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                <div className="text-center mt-3">
                                    <p className="text-[10px] text-gray-500">Sync Intelligence can make mistakes. Consider checking important information.</p>
                                </div>
                            </div>

                            {/* --- 4. Task Context Panel (Slide-in) --- */}
                            <AnimatePresence>
                                {showTaskPanel && (
                                    <TaskContextPanel
                                        onSelectTask={(task) => {
                                            setActiveContext(task);
                                            setShowTaskPanel(false);
                                            // Auto-send analysis request
                                            setInput(`Help me with this task: "${task.title}"`);
                                        }}
                                        onClose={() => setShowTaskPanel(false)}
                                    />
                                )}
                            </AnimatePresence>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIOverlay;
