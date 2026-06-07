'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Compass, Users, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { vote } from '@/app/actions';

interface OnboardingWizardProps {
    userId: string;
    onComplete: () => void;
}

export default function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [votes, setVotes] = useState<Record<string, 'a' | 'b'>>({});
    const [followed, setFollowed] = useState<string[]>([]);
    const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);

    // Step 1 Interests
    const interests = ['Teknologi', 'Makanan', 'Kampus', 'Hubungan', 'Karier', 'Hiburan', 'Isu Viral'];

    // Step 2 Topics for quick voting
    const onboardingTopics = [
        {
            id: 't0000000-0000-0000-0000-000000000001',
            question: 'Tim bubur diaduk masih punya alasan paling kuat, kamu di kubu mana?',
            option_a: 'Kubu Diaduk',
            option_b: 'Kubu Tidak Diaduk'
        },
        {
            id: 't0000000-0000-0000-0000-000000000002',
            question: 'Apakah Android lebih bebas dan worth it daripada iPhone?',
            option_a: 'Android Bebas',
            option_b: 'iPhone Stabil'
        },
        {
            id: 't0000000-0000-0000-0000-000000000009',
            question: 'Es teh manis adalah minuman nasional tidak resmi Indonesia?',
            option_a: 'Setuju Banget',
            option_b: 'Biasa Saja'
        }
    ];

    // Step 3 Creators to follow
    const creators = [
        { id: 'a0000000-0000-0000-0000-000000000001', username: 'analis_opini', title: 'Penggerak Opini' },
        { id: 'a0000000-0000-0000-0000-000000000002', username: 'budi_wicaksono', title: 'Pemantik Diskusi' },
        { id: 'a0000000-0000-0000-0000-000000000003', username: 'siti_rahma', title: 'Tokoh Kubu' }
    ];

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const handleVoteSelect = (topicId: string, choice: 'a' | 'b') => {
        setVotes(prev => ({ ...prev, [topicId]: choice }));
    };

    const handleFollowToggle = (id: string) => {
        setFollowed(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleNextStep = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            // Submit votes to database
            setIsSubmittingVotes(true);
            try {
                for (const [topicId, choice] of Object.entries(votes)) {
                    await vote(topicId, choice);
                }
            } catch (err) {
                console.error('Error submitting onboarding votes:', err);
            } finally {
                setIsSubmittingVotes(false);
                setStep(3);
            }
        } else if (step === 3) {
            // Save settings locally and finish
            localStorage.setItem(`kubu_onboarding_completed_${userId}`, 'true');
            localStorage.setItem(`kubu_interests_${userId}`, JSON.stringify(selectedInterests));
            localStorage.setItem(`kubu_followed_creators_${userId}`, JSON.stringify(followed));
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#080B12] flex items-center justify-center p-4">
            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-choice-left/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#111827] border border-[#253044] rounded-[32px] p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden"
            >
                {/* Visual Step Indicator */}
                <div className="flex items-center gap-2 mb-6 select-none">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                s <= step ? 'bg-brand-blue' : 'bg-[#253044]'
                            }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        /* STEP 1: PILIH MINAT */
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 text-left"
                        >
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-brand-border rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                    <Compass className="w-3.5 h-3.5 text-brand-blue" />
                                    Langkah 1 dari 3
                                </span>
                                <h2 className="text-2xl font-black text-white">Apa minat diskusimu?</h2>
                                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                                    Pilih topik yang menarik bagimu untuk menyesuaikan feed opini pribadimu.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2.5 py-4">
                                {interests.map((interest) => {
                                    const isSelected = selectedInterests.includes(interest);
                                    return (
                                        <button
                                            key={interest}
                                            onClick={() => toggleInterest(interest)}
                                            className={`px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                                                isSelected
                                                    ? 'bg-brand-blue border-brand-blue text-white shadow-md shadow-brand-blue/10'
                                                    : 'bg-zinc-950/40 border-brand-border text-slate-400 hover:text-white hover:border-zinc-700'
                                            }`}
                                        >
                                            {interest}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleNextStep}
                                disabled={selectedInterests.length === 0}
                                className="w-full py-3 bg-white hover:bg-zinc-200 text-black disabled:opacity-50 font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider active:scale-[0.98]"
                            >
                                <span>Lanjutkan</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        /* STEP 2: PILIH 3 TOPIK PERTAMA */
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 text-left"
                        >
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-brand-border rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                    <HelpCircle className="w-3.5 h-3.5 text-brand-blue" />
                                    Langkah 2 dari 3
                                </span>
                                <h2 className="text-2xl font-black text-white">Pilih kubumu dulu</h2>
                                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                                    Pilih sisi di 3 topik ringan berikut untuk memulai kontribusi opinimu.
                                </p>
                            </div>

                            <div className="space-y-4 py-2">
                                {onboardingTopics.map((topic) => {
                                    const userChoice = votes[topic.id];
                                    return (
                                        <div key={topic.id} className="p-4 bg-zinc-950/40 border border-brand-border/60 rounded-2xl space-y-3">
                                            <h4 className="text-xs font-bold text-white leading-normal">
                                                {topic.question}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleVoteSelect(topic.id, 'a')}
                                                    className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer ${
                                                        userChoice === 'a'
                                                            ? 'bg-choice-left/10 border-choice-left text-choice-left'
                                                            : 'bg-zinc-900 border-brand-border text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    {topic.option_a}
                                                </button>
                                                <button
                                                    onClick={() => handleVoteSelect(topic.id, 'b')}
                                                    className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer ${
                                                        userChoice === 'b'
                                                            ? 'bg-choice-right/10 border-choice-right text-choice-right'
                                                            : 'bg-zinc-900 border-brand-border text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    {topic.option_b}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleNextStep}
                                disabled={Object.keys(votes).length < 3 || isSubmittingVotes}
                                className="w-full py-3 bg-white hover:bg-zinc-200 text-black disabled:opacity-50 font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider active:scale-[0.98]"
                            >
                                {isSubmittingVotes ? (
                                    <>
                                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                        <span>Menyimpan Pilihan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Lanjutkan</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        /* STEP 3: FOLLOW BEBERAPA USER AWAL */
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 text-left"
                        >
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-brand-border rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                    <Users className="w-3.5 h-3.5 text-brand-blue" />
                                    Langkah 3 dari 3
                                </span>
                                <h2 className="text-2xl font-black text-white">Ikuti orang berpengaruh</h2>
                                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                                    Ikuti kreator dan pengamat berikut untuk melihat argumen cerdas di feed-mu.
                                </p>
                            </div>

                            <div className="space-y-3 py-2">
                                {creators.map((creator) => {
                                    const isFollowed = followed.includes(creator.id);
                                    return (
                                        <div key={creator.id} className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-brand-border/60 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-brand-border flex items-center justify-center text-xs font-black text-zinc-400 uppercase">
                                                    {creator.username[0]}
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-white leading-none">
                                                        @{creator.username}
                                                    </span>
                                                    <span className="inline-block text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                                                        {creator.title}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleFollowToggle(creator.id)}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
                                                    isFollowed
                                                        ? 'bg-zinc-900 border border-brand-border text-slate-500'
                                                        : 'bg-white text-black hover:bg-zinc-200'
                                                }`}
                                            >
                                                {isFollowed ? (
                                                    <span className="flex items-center gap-1">
                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                        Diikuti
                                                    </span>
                                                ) : (
                                                    'Ikuti'
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleNextStep}
                                className="w-full py-3 bg-brand-blue hover:bg-blue-600 text-white font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider active:scale-[0.98]"
                            >
                                <span>Selesai &amp; Masuk Feed</span>
                                <Check className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
