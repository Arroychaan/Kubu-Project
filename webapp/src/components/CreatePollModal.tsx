'use client';

import { useState, useTransition, useEffect } from 'react';
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

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('kubu-open-create-modal', handleOpen);
        return () => window.removeEventListener('kubu-open-create-modal', handleOpen);
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!user) {
            setMessage({ type: 'error', text: 'Silakan masuk ke akun kamu terlebih dahulu untuk membuat topik baru.' });
            return;
        }

        startTransition(async () => {
            const result = await createPoll(question, optionA, optionB);

            if (result.success) {
                setMessage({ type: 'success', text: 'Jajak pendapat berhasil diterbitkan!' });
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
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-brand-blue rounded-full shadow-lg shadow-brand-blue/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative p-6 pb-4 bg-background border-b border-brand-border">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-brand-blue" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white">Buat Topik Baru</h2>
                                        <p className="text-xs text-slate-500 font-semibold">Ajukan topik diskusi baru ke publik</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Question Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Pertanyaan Utama <span className="text-choice-left">*</span>
                                    </label>
                                    <textarea
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="Tulis topik diskusi/pertanyaan kamu di sini..."
                                        rows={3}
                                        maxLength={200}
                                        className="w-full px-4 py-3 bg-background border border-brand-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 transition-all resize-none text-sm font-medium"
                                        required
                                    />
                                    <p className="text-right text-[10px] font-semibold text-slate-500 mt-1">{question.length}/200</p>
                                </div>

                                {/* Options split input */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-choice-left uppercase tracking-wider mb-2">
                                            Kubu A <span className="text-choice-left">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={optionA}
                                            onChange={(e) => setOptionA(e.target.value)}
                                            placeholder="Pilihan pertama..."
                                            maxLength={50}
                                            className="w-full px-4 py-3 bg-background border border-brand-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-choice-left/55 transition-all text-xs font-semibold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-choice-right uppercase tracking-wider mb-2">
                                            Kubu B <span className="text-choice-right">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={optionB}
                                            onChange={(e) => setOptionB(e.target.value)}
                                            placeholder="Pilihan kedua..."
                                            maxLength={50}
                                            className="w-full px-4 py-3 bg-background border border-brand-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-choice-right/55 transition-all text-xs font-semibold"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Validation Message */}
                                <AnimatePresence>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`p-3 rounded-xl text-xs font-semibold ${message.type === 'success'
                                                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/15 text-red-400 border border-red-500/20'
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
                                    className="w-full py-3 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                            <span>Menerbitkan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4.5 h-4.5" />
                                            <span>Terbitkan Topik</span>
                                        </>
                                    )}
                                </button>

                                {!user && (
                                    <p className="text-center text-xs text-slate-500 font-semibold">
                                        Kamu harus <a href="/auth/login" className="text-brand-blue hover:underline">masuk</a> untuk membuat topik baru.
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
