import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiLoader } from 'react-icons/fi';
import { generateTaskContent } from '../../services/taskAIService';

/**
 * Compact Breathing AI Enhancement Text
 * Positioned next to Description heading
 */
const AITaskAssistant = ({ onEnhance, task, isGenerating, setIsGenerating }) => {
    const [additionalContext, setAdditionalContext] = useState('');
    const [showContextInput, setShowContextInput] = useState(false);
    const [error, setError] = useState('');

    const handleEnhance = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        setError('');

        try {
            const response = await generateTaskContent({
                existingTitle: task.title || '',
                existingDescription: task.description || '',
                existingType: task.type || 'Task',
                additionalInfo: additionalContext.trim(),
                textLength: 'medium'
            });

            if (response.error) {
                setError(response.error);
            } else {
                onEnhance(response.data);
                setAdditionalContext('');
                setShowContextInput(false);
            }
        } catch (e) {
            setError('Enhancement failed');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            className="relative inline-block ml-3"
            onMouseEnter={() => !isGenerating && setShowContextInput(true)}
            onMouseLeave={() => !additionalContext && setShowContextInput(false)}
        >
            {/* Compact Breathing Text */}
            <motion.button
                onClick={handleEnhance}
                disabled={isGenerating}
                className="group relative text-xs font-bold flex items-center gap-1.5 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isGenerating ? (
                    <>
                        <FiLoader className="w-3 h-3 text-cyan-500 animate-spin" />
                        <span className="text-cyan-500">Enhancing...</span>
                    </>
                ) : (
                    <>
                        {/* Breathing glow effect */}
                        <motion.div
                            className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-lg blur-sm"
                            animate={{
                                opacity: [0.5, 0.8, 0.5],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />

                        <FiZap className="w-3 h-3 text-cyan-500 relative z-10" />
                        <span className="relative z-10 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                            Enhance with Sync AI
                        </span>
                    </>
                )}
            </motion.button>

            {/* Hover Context Input */}
            <AnimatePresence>
                {showContextInput && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-80 z-50"
                    >
                        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 backdrop-blur-xl rounded-xl shadow-2xl border border-cyan-500/20 p-3">
                            {/* Ambient glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 rounded-xl pointer-events-none"></div>

                            <div className="relative">
                                <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
                                    Additional Context (Optional)
                                </label>
                                <textarea
                                    value={additionalContext}
                                    onChange={(e) => setAdditionalContext(e.target.value)}
                                    placeholder="Add specific requirements or details..."
                                    className="w-full h-20 px-3 py-2 bg-white/5 border border-cyan-500/20 rounded-lg text-slate-100 placeholder-slate-500 text-sm resize-none outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                                    autoFocus
                                />
                                <div className="text-[9px] text-slate-600 mt-1 text-right">
                                    {additionalContext.length}/200
                                </div>
                            </div>

                            {error && (
                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-[10px] text-red-400 font-medium">{error}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AITaskAssistant;
