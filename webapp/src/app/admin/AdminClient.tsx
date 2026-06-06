'use client';

import { useState, useTransition } from 'react';
import { toggleOfficialPoll, updateDailyPollLimit } from '@/app/actions';
import { Shield, Settings, Database, Users, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PollItem {
    id: string;
    question: string;
    option_a: string;
    option_b: string;
    is_official: boolean | null;
    created_at: string;
}

interface AuditLogItem {
    id: string;
    actor_id: string | null;
    actor_role: string | null;
    action: string;
    target_table: string;
    details: any;
    created_at: string;
}

interface AdminClientProps {
    initialPolls: PollItem[];
    initialLimit: number;
    initialLogs: AuditLogItem[];
}

export default function AdminClient({ initialPolls, initialLimit, initialLogs }: AdminClientProps) {
    const router = useRouter();
    const [polls, setPolls] = useState<PollItem[]>(initialPolls);
    const [limit, setLimit] = useState<number>(initialLimit);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const [actionId, setActionId] = useState<string | null>(null);

    const handleToggleOfficial = (pollId: string, currentStatus: boolean) => {
        setActionId(pollId);
        setMessage(null);
        const nextStatus = !currentStatus;

        startTransition(async () => {
            const result = await toggleOfficialPoll(pollId, nextStatus);

            if (result.success) {
                // Update local state
                setPolls(prev =>
                    prev.map(p => (p.id === pollId ? { ...p, is_official: nextStatus } : p))
                );
                setMessage({ type: 'success', text: result.message });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.message });
            }
            setActionId(null);
        });
    };

    const handleUpdateLimit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setActionId('limit');

        startTransition(async () => {
            const result = await updateDailyPollLimit(limit);

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.message });
            }
            setActionId(null);
        });
    };

    const totalOfficial = polls.filter(p => p.is_official).length;
    const totalCommunity = polls.filter(p => !p.is_official).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-brand-border pb-6">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Dashboard Administrator</h1>
                    <p className="text-slate-400 text-sm font-medium">Panel kontrol utama untuk mengelola konten dan pengaturan platform KUBU.</p>
                </div>
            </div>

            {/* Banner feedback */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${
                    message.type === 'success'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Metrics cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                    <div className="w-10 h-10 rounded-lg bg-choice-left/15 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-choice-left" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Polling</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">{polls.length}</h3>
                    </div>
                </div>

                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/15 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Polling Resmi</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">{totalOfficial}</h3>
                    </div>
                </div>

                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                    <div className="w-10 h-10 rounded-lg bg-choice-right/15 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-choice-right" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Polling Komunitas</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">{totalCommunity}</h3>
                    </div>
                </div>
            </div>

            {/* Settings & Audit Log Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                        <h2 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-brand-blue" />
                            Konfigurasi Limit
                        </h2>
                        <form onSubmit={handleUpdateLimit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batas Post Harian User</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-background border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-blue/60 transition-all font-semibold text-sm"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isPending && actionId === 'limit'}
                                className="w-full py-2.5 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-brand-blue/10 disabled:opacity-50"
                            >
                                {isPending && actionId === 'limit' ? 'Menyimpan...' : 'Perbarui Batas'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                        <h2 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Petunjuk Moderasi
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Sebagai administrator, Anda dapat menetapkan polling buatan komunitas menjadi **Polling Resmi** hari ini agar muncul di halaman depan sebagai fokus utama jajak pendapat nasional.
                        </p>
                    </div>
                </div>

                {/* Audit log panel */}
                <div className="lg:col-span-8 bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col">
                    <h2 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4 text-choice-right" />
                        Log Audit Database
                    </h2>
                    <div className="flex-1 overflow-x-auto">
                        {initialLogs.length > 0 ? (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {initialLogs.map((log) => (
                                    <div key={log.id} className="bg-background border border-brand-border rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
                                        <div className="flex items-start gap-2.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-white uppercase">{log.action}</span>
                                                    <span className="text-slate-500">pada tabel</span>
                                                    <span className="font-semibold text-slate-300">{log.target_table}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Actor: {log.actor_role} ({log.actor_id?.substring(0, 8)}...)</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 md:text-right">
                                            {new Date(log.created_at).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 text-sm font-semibold">
                                Belum ada log aktivitas terdaftar.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Poll Table Management */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-base font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-choice-left" />
                    Manajemen Jajak Pendapat
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-brand-border pb-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                <th className="pb-3 pr-4">Pertanyaan</th>
                                <th className="pb-3 px-4 hidden md:table-cell">Kubu A vs B</th>
                                <th className="pb-3 px-4 text-center">Status</th>
                                <th className="pb-3 pl-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border text-sm font-medium text-slate-300">
                            {polls.map((poll) => (
                                <tr key={poll.id} className="hover:bg-background/40 transition-colors">
                                    <td className="py-4 pr-4 max-w-[280px] truncate font-bold text-white" title={poll.question}>
                                        {poll.question}
                                    </td>
                                    <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-400">
                                        {poll.option_a} <span className="text-brand-blue font-bold">vs</span> {poll.option_b}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                            poll.is_official
                                                ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20'
                                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {poll.is_official ? 'Resmi' : 'Komunitas'}
                                        </span>
                                    </td>
                                    <td className="py-4 pl-4 text-right">
                                        <button
                                            onClick={() => handleToggleOfficial(poll.id, !!poll.is_official)}
                                            disabled={isPending && actionId === poll.id}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                                                poll.is_official
                                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                                    : 'bg-brand-blue hover:bg-blue-600 text-white shadow-md shadow-brand-blue/10'
                                            }`}
                                        >
                                            {isPending && actionId === poll.id
                                                ? 'Memproses...'
                                                : poll.is_official
                                                ? 'Ubah ke Komunitas'
                                                : 'Setel Resmi'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
