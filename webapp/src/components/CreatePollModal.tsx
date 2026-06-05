'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Sparkles, Zap } from 'lucide-react';
import { createPoll } from '@/app/actions';
import { useAuthStore } from '@/store/useAuthStore';

interface CreatePollModalProps {
    onPollCreated?: () => void;
}

export default function CreatePollModal({ onPollCreated }: CreatePollModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const { user } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!user) {
            setMessage({ type: 'error', text: 'Please login to create a poll.' });
            return;
        }

        startTransition(async () => {
            const result = await createPoll(question, optionA, optionB);

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setQuestion('');
                setOptionA('');
                setOptionB('');
                onPollCreated?.();

                // Close modal after success
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage(null);
                }, 1500);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        });
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-neon-pink to-neon-cyan rounded-full shadow-lg shadow-neon-pink/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
            >
                <Plus className="w-7 h-7" />
            </motion.button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative p-6 pb-4 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 border-b border-white/10">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink to-neon-cyan flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Start a War</h2>
                                        <p className="text-sm text-white/50">Create a new battle</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Question Input */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        The Question <span className="text-neon-pink">*</span>
                                    </label>
                                    <textarea
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="What's the ultimate debate?"
                                        rows={2}
                                        maxLength={200}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all resize-none"
                                        required
                                    />
                                    <p className="text-right text-xs text-white/30 mt-1">{question.length}/200</p>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neon-pink mb-2">
                                            Option A
                                        </label>
                                        <input
                                            type="text"
                                            value={optionA}
                                            onChange={(e) => setOptionA(e.target.value)}
                                            placeholder="First choice..."
                                            maxLength={50}
                                            className="w-full px-4 py-3 bg-neon-pink/10 border border-neon-pink/30 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-pink/60 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neon-cyan mb-2">
                                            Option B
                                        </label>
                                        <input
                                            type="text"
                                            value={optionB}
                                            onChange={(e) => setOptionB(e.target.value)}
                                            placeholder="Second choice..."
                                            maxLength={50}
                                            className="w-full px-4 py-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/60 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <AnimatePresence>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isPending || !user}
                                    className="w-full py-3 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-neon-pink/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Start the War!
                                        </>
                                    )}
                                </button>

                                {!user && (
                                    <p className="text-center text-sm text-white/40">
                                        You need to <a href="/auth/login" className="text-neon-cyan underline">login</a> to create polls.
                                    </p>
                                )}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
